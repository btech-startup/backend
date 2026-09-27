import { NegotiationRepository } from '../repositories/negotiationRepository';
import { BookingRepository } from '../repositories/bookingRepository';
import { NegotiationSender, NegotiationStatus, BookingStatus } from '../types/index';
import { BookingStateMachine } from './bookingStateMachine';
import { logger } from '../utils/logger';

export class NegotiationRuleError extends Error {
  public statusCode: number = 400;
  constructor(message: string) {
    super(message);
    this.name = 'NegotiationRuleError';
  }
}

export class NegotiationService {
  /**
   * 1. Propose Structured Counter-Offer:
   * Enforces rules from Image 2:
   * - min discount = 5%
   * - max discount = 15%
   * - 12-hour response window
   */
  static async proposeCounterOffer(data: {
    booking_id: string;
    sender_type: NegotiationSender;
    listing_price: number;
    proposed_price: number;
    remarks?: string;
  }) {
    if (!data.listing_price || data.listing_price <= 0) {
      throw new NegotiationRuleError('Listing price must be a valid positive number.');
    }
    if (!data.proposed_price || data.proposed_price <= 0) {
      throw new NegotiationRuleError('Proposed price must be a valid positive number.');
    }

    const discountPercentage =
      ((data.listing_price - data.proposed_price) / data.listing_price) * 100;

    // Rule: min - DISC = 5%, max - DISC = 15%
    if (discountPercentage < 5 || discountPercentage > 15) {
      throw new NegotiationRuleError(
        `Counter-offer discount is ${discountPercentage.toFixed(2)}%. Must be strictly between 5% and 15% of listing price.`
      );
    }

    // Check if booking exists
    const booking = await BookingRepository.findById(data.booking_id);
    if (booking) {
      // Transition booking state to negotiating if not already
      if (booking.status === BookingStatus.DRAFT) {
        await BookingStateMachine.transition(booking.id, BookingStatus.NEGOTIATING, {
          reason: 'Counter-offer proposed',
        });
      }
    }

    const negotiation = await NegotiationRepository.createCounterOffer({
      booking_id: data.booking_id,
      sender_type: data.sender_type,
      proposed_price: data.proposed_price,
      counter_discount_percentage: Math.round(discountPercentage * 100) / 100,
      remarks: data.remarks,
      expiresInHours: 12, // Rule: 12 hrs vendor response window
    });

    logger.info(
      `[Deal Desk] Counter-offer proposed for booking ${data.booking_id}. Proposed: ₹${data.proposed_price} (${discountPercentage.toFixed(1)}% discount). Expires in 12 hours.`
    );

    return {
      negotiation,
      rules: {
        minDiscount: '5%',
        maxDiscount: '15%',
        appliedDiscount: `${discountPercentage.toFixed(2)}%`,
        responseWindowHours: 12,
        expiresAt: negotiation.expires_at,
      },
      message: 'Counter-offer transmitted. Allocated 12-hour response window.',
    };
  }

  /**
   * 2. Get Negotiations by Booking ID:
   * Returns complete deal desk history, marks expired negotiations if 12h window has elapsed.
   */
  static async getByBookingId(bookingId: string) {
    const thread = await NegotiationRepository.findByBookingId(bookingId);
    const now = new Date();

    // Check 12-hour expiration on pending negotiations
    const updatedThread = await Promise.all(
      thread.map(async (item) => {
        if (item.status === NegotiationStatus.PENDING && new Date(item.expires_at) < now) {
          await NegotiationRepository.updateStatus(item.id, NegotiationStatus.EXPIRED);
          item.status = NegotiationStatus.EXPIRED;
        }
        return item;
      })
    );

    const activeOffer = updatedThread.find((n) => n.status === NegotiationStatus.PENDING) || null;

    let remainingMinutes = 0;
    if (activeOffer) {
      const diffMs = new Date(activeOffer.expires_at).getTime() - now.getTime();
      remainingMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    }

    return {
      booking_id: bookingId,
      activeOffer,
      remainingMinutes,
      history: updatedThread,
    };
  }

  /**
   * 3. Accept Offer:
   * Rule: Locks the negotiated offer into the booking, recalculates financials, and updates status.
   */
  static async acceptOffer(negotiationId: string, actorRole?: string) {
    const negotiation = await NegotiationRepository.findById(negotiationId);
    if (!negotiation) {
      throw new NegotiationRuleError('Negotiation offer not found.');
    }

    if (negotiation.status !== NegotiationStatus.PENDING) {
      throw new NegotiationRuleError(`Cannot accept an offer with status '${negotiation.status}'.`);
    }

    const now = new Date();
    if (new Date(negotiation.expires_at) < now) {
      await NegotiationRepository.updateStatus(negotiationId, NegotiationStatus.EXPIRED);
      throw new NegotiationRuleError(
        '12-hour vendor response window has expired. Offer is no longer valid.'
      );
    }

    // Role-based acceptance guard: sender cannot accept their own proposal
    if (actorRole) {
      if (
        (negotiation.sender_type === NegotiationSender.CLIENT && actorRole === 'customer') ||
        (negotiation.sender_type === NegotiationSender.VENDOR && actorRole === 'vendor')
      ) {
        throw new NegotiationRuleError('You cannot accept your own proposed offer. Awaiting counter-party.');
      }
    }

    // Mark negotiation as accepted
    await NegotiationRepository.updateStatus(negotiationId, NegotiationStatus.ACCEPTED);

    // Lock price into Booking
    const booking = await BookingRepository.findById(negotiation.booking_id);
    if (booking) {
      const acceptedPrice = Number(negotiation.proposed_price);
      const platformFee = Math.round(acceptedPrice * 0.1 * 100) / 100;
      const taxAmount = Math.round(acceptedPrice * 0.18 * 100) / 100; // 18% GST
      const netPayable = Math.round((acceptedPrice + taxAmount) * 100) / 100;

      await BookingRepository.updatePricing(
        booking.id,
        acceptedPrice,
        platformFee,
        taxAmount,
        netPayable
      );

      // Transition state machine: NEGOTIATING -> DRAFT (ready for checkout)
      if (booking.status === BookingStatus.NEGOTIATING) {
        await BookingStateMachine.transition(booking.id, BookingStatus.DRAFT, {
          reason: `Negotiated offer ₹${acceptedPrice} accepted. Deal locked for checkout.`,
        });
      }
    }

    logger.info(`[Deal Desk] Offer ${negotiationId} accepted. Deal locked at ₹${negotiation.proposed_price}`);

    return {
      negotiationId,
      status: NegotiationStatus.ACCEPTED,
      lockedPrice: negotiation.proposed_price,
      message: 'Offer accepted successfully. Deal locked for booking checkout.',
    };
  }

  /**
   * 4. Counter Offer:
   * Counter an existing negotiation. Validates 5%-15% window and starts a fresh 12-hour timer.
   */
  static async counterOffer(
    negotiationId: string,
    data: {
      sender_type: NegotiationSender;
      listing_price: number;
      proposed_price: number;
      remarks?: string;
    }
  ) {
    const existing = await NegotiationRepository.findById(negotiationId);
    if (!existing) {
      throw new NegotiationRuleError('Negotiation thread not found.');
    }

    if (existing.status !== NegotiationStatus.PENDING) {
      throw new NegotiationRuleError(`Cannot counter an offer with status '${existing.status}'.`);
    }

    const now = new Date();
    if (new Date(existing.expires_at) < now) {
      await NegotiationRepository.updateStatus(negotiationId, NegotiationStatus.EXPIRED);
      throw new NegotiationRuleError('12-hour response window expired. Please initiate a new proposal.');
    }

    // Validate 5%-15% discount window
    const discountPercentage =
      ((data.listing_price - data.proposed_price) / data.listing_price) * 100;

    if (discountPercentage < 5 || discountPercentage > 15) {
      throw new NegotiationRuleError(
        `Counter-offer discount is ${discountPercentage.toFixed(2)}%. Must be strictly between 5% and 15% of listing price.`
      );
    }

    // Mark current offer as countered
    await NegotiationRepository.updateStatus(negotiationId, NegotiationStatus.COUNTERED);

    // Create new counter-offer with fresh 12-hour window
    const newOffer = await NegotiationRepository.createCounterOffer({
      booking_id: existing.booking_id,
      sender_type: data.sender_type,
      proposed_price: data.proposed_price,
      counter_discount_percentage: Math.round(discountPercentage * 100) / 100,
      remarks: data.remarks,
      expiresInHours: 12,
    });

    logger.info(
      `[Deal Desk] Counter offer created for ${existing.booking_id}. New price: ₹${data.proposed_price} (${discountPercentage.toFixed(1)}% discount).`
    );

    return {
      previousOfferId: negotiationId,
      newOffer,
      message: 'Counter-offer registered. 12-hour response window reset.',
    };
  }

  /**
   * 5. Reject Offer:
   * Terminates the negotiation thread.
   */
  static async rejectOffer(negotiationId: string, actorRole?: string, remarks?: string) {
    const existing = await NegotiationRepository.findById(negotiationId);
    if (!existing) {
      throw new NegotiationRuleError('Negotiation offer not found.');
    }

    if (existing.status !== NegotiationStatus.PENDING) {
      throw new NegotiationRuleError(`Cannot reject an offer with status '${existing.status}'.`);
    }

    await NegotiationRepository.updateStatus(negotiationId, NegotiationStatus.REJECTED);

    logger.info(`[Deal Desk] Offer ${negotiationId} rejected by ${actorRole || 'user'}. Remarks: ${remarks || 'None'}`);

    return {
      negotiationId,
      status: NegotiationStatus.REJECTED,
      message: 'Offer has been rejected.',
    };
  }
}

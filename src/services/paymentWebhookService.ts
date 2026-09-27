import crypto from 'crypto';
import { BookingRepository } from '../repositories/bookingRepository';
import { MilestoneRepository } from '../repositories/milestoneRepository';
import { EscrowLedgerRepository } from '../repositories/escrowLedgerRepository';
import { BookingStateMachine } from './bookingStateMachine';
import { BookingStatus, LedgerEntryType, MilestoneStatus } from '../types/index';
import { logger } from '../utils/logger';

export class PaymentSecurityError extends Error {
  public statusCode: number = 401;
  constructor(message: string = 'Payment webhook signature verification failed') {
    super(message);
    this.name = 'PaymentSecurityError';
  }
}

// Memory set for idempotency guard against replay attacks
const processedPayments: Set<string> = new Set();

export class PaymentWebhookService {
  private static readonly DEFAULT_WEBHOOK_SECRET =
    process.env.PAYMENT_WEBHOOK_SECRET || 'vortix_webhook_secret_key_2026';

  /**
   * Verify cryptographic HMAC-SHA256 signature with constant-time equality check
   */
  public static verifySignature(
    payload: string | Buffer,
    signature: string,
    secret: string = this.DEFAULT_WEBHOOK_SECRET
  ): boolean {
    if (!signature) return false;

    try {
      const payloadString = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadString)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const actualBuffer = Buffer.from(signature, 'utf8');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch (e) {
      return false;
    }
  }

  /**
   * Process inbound payment gateway webhook
   */
  public static async processWebhook(
    rawBody: string | Buffer,
    signature: string,
    eventPayload: any,
    provider: string = 'razorpay'
  ) {
    // ─── Step 1: High Security Cryptographic Signature Guard ──
    const isValid = this.verifySignature(rawBody, signature);
    if (!isValid && process.env.NODE_ENV === 'production') {
      logger.error(`[Payment Webhook] Invalid signature from provider: ${provider}`);
      throw new PaymentSecurityError('Invalid cryptographic payment webhook signature.');
    }

    const event = eventPayload.event || 'payment.captured';
    const paymentData = eventPayload.payload?.payment?.entity || eventPayload.data || eventPayload;

    const paymentId = paymentData.id || `pay_${Date.now()}`;
    const bookingId = paymentData.notes?.booking_id || eventPayload.booking_id;
    const amount = Number(paymentData.amount ? paymentData.amount / 100 : eventPayload.amount || 0);

    // ─── Step 2: Idempotency Verification ─────────────────────
    if (processedPayments.has(paymentId)) {
      logger.warn(`[Payment Webhook] Duplicate payment webhook ignored for paymentId: ${paymentId}`);
      return {
        success: true,
        idempotent: true,
        message: 'Payment already processed and verified.',
        paymentId,
      };
    }

    if (!bookingId) {
      logger.warn('[Payment Webhook] Webhook received without associated booking_id');
      return { success: true, warning: 'No booking_id associated with payment entity.' };
    }

    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found for webhook settlement.`);
    }

    // ─── Step 3: Booking State Machine Advance ─────────────────
    // Transition from DRAFT -> ADVANCE_PAID
    await BookingStateMachine.transition(bookingId, BookingStatus.ADVANCE_PAID, {
      actorId: 'payment_gateway',
      actorRole: 'webhook',
      reason: `Advance payment verified (${paymentId}) for ₹${amount}`,
    });

    // ─── Step 4: Fund Milestone 1 in Escrow ───────────────────
    const milestones = await MilestoneRepository.findByBookingId(bookingId);
    const advanceMilestone = milestones.find((m) => m.stage === 'advance_lock') || milestones[0];

    if (advanceMilestone) {
      await MilestoneRepository.updateStatus(advanceMilestone.id, MilestoneStatus.HELD_ESCROW);
    }

    // ─── Step 5: Append to Double-Entry Escrow Ledger ─────────
    const idempotencyKey = `ESCROW_DEP_${bookingId}_${paymentId}`;
    await EscrowLedgerRepository.addEntry({
      booking_id: bookingId,
      milestone_id: advanceMilestone ? advanceMilestone.id : undefined,
      entry_type: LedgerEntryType.ESCROW_DEPOSIT,
      amount: amount || Number(booking.gross_amount) * 0.20,
      debit_account: 'customer_payment_inbound',
      credit_account: 'nodal_escrow_holding',
      gateway_reference_id: paymentId,
      idempotency_key: idempotencyKey,
    });

    // Mark as processed
    processedPayments.add(paymentId);

    logger.info(
      `[Payment Webhook] Successfully processed payment ${paymentId} for booking ${bookingId}. Milestone 1 funded into escrow.`
    );

    return {
      success: true,
      bookingId,
      bookingReference: booking.booking_reference,
      paymentId,
      amount,
      bookingStatus: BookingStatus.ADVANCE_PAID,
      escrowStatus: 'Milestone 1 (20% Advance) funded into Nodal Escrow',
    };
  }
}

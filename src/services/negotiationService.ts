import { NegotiationRepository } from '../repositories/negotiationRepository.js';
import { NegotiationSender } from '../types/index.js';

export class NegotiationService {
  /**
   * Propose Structured Counter-Offer with algorithmic 5%-15% window and 12-hour response timer
   */
  static async proposeCounterOffer(data: {
    booking_id: string;
    sender_type: NegotiationSender;
    listing_price: number;
    proposed_price: number;
    remarks?: string;
  }) {
    const discountPercentage =
      ((data.listing_price - data.proposed_price) / data.listing_price) * 100;

    if (discountPercentage < 5 || discountPercentage > 15) {
      throw new Error('Counter-offer discount must be between 5% and 15% of listing price.');
    }

    const negotiation = await NegotiationRepository.createCounterOffer({
      booking_id: data.booking_id,
      sender_type: data.sender_type,
      proposed_price: data.proposed_price,
      counter_discount_percentage: Math.round(discountPercentage * 100) / 100,
      remarks: data.remarks,
      expiresInHours: 12,
    });

    return {
      negotiation,
      message: 'Counter-offer transmitted. Vendor allocated 12-hour response window.',
    };
  }
}

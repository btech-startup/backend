import { BookingStatus } from '../types/index';
import { BookingRepository } from '../repositories/bookingRepository';
import { logger } from '../utils/logger';

export class InvalidStateTransitionError extends Error {
  public statusCode: number = 400;
  constructor(fromStatus: BookingStatus, toStatus: BookingStatus, reason?: string) {
    super(
      `Illegal booking state transition from '${fromStatus}' to '${toStatus}'.${reason ? ' ' + reason : ''}`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export class BookingStateMachine {
  /**
   * Transition matrix defining permissible next states
   */
  private static readonly ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    [BookingStatus.DRAFT]: [
      BookingStatus.NEGOTIATING,
      BookingStatus.ADVANCE_PAID,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.NEGOTIATING]: [
      BookingStatus.DRAFT,
      BookingStatus.ADVANCE_PAID,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.ADVANCE_PAID]: [
      BookingStatus.ACTIVE_CONFIRMED,
      BookingStatus.DISPUTED,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.ACTIVE_CONFIRMED]: [
      BookingStatus.COMPLETED,
      BookingStatus.DISPUTED,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.DISPUTED]: [
      BookingStatus.ACTIVE_CONFIRMED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.COMPLETED]: [], // Terminal state
    [BookingStatus.CANCELLED]: [], // Terminal state
  };

  /**
   * Validate if a transition from currentStatus to newStatus is allowed
   */
  public static canTransition(currentStatus: BookingStatus, newStatus: BookingStatus): boolean {
    const allowed = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  /**
   * Execute state transition on a booking with rule enforcement and audit logging
   */
  public static async transition(
    bookingId: string,
    targetStatus: BookingStatus,
    metadata?: { actorId?: string; actorRole?: string; reason?: string }
  ): Promise<{ previousStatus: BookingStatus; newStatus: BookingStatus; bookingId: string }> {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new Error(`Booking with ID '${bookingId}' not found.`);
    }

    const currentStatus = booking.status as BookingStatus;

    // Idempotent check: if already in target state, return without error
    if (currentStatus === targetStatus) {
      return { previousStatus: currentStatus, newStatus: targetStatus, bookingId };
    }

    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new InvalidStateTransitionError(
        currentStatus,
        targetStatus,
        `Booking ${bookingId} cannot move from ${currentStatus} to ${targetStatus}.`
      );
    }

    await BookingRepository.updateStatus(bookingId, targetStatus);

    logger.info(
      `[Booking State Machine] Booking ${bookingId} transitioned: ${currentStatus} -> ${targetStatus}` +
        (metadata?.reason ? ` (Reason: ${metadata.reason})` : '') +
        (metadata?.actorRole ? ` by ${metadata.actorRole} (${metadata.actorId})` : '')
    );

    return {
      previousStatus: currentStatus,
      newStatus: targetStatus,
      bookingId,
    };
  }

  /**
   * Helper to inspect allowable next statuses for a booking
   */
  public static getNextAllowedStates(currentStatus: BookingStatus): BookingStatus[] {
    return this.ALLOWED_TRANSITIONS[currentStatus] || [];
  }
}

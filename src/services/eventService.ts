import { EventTypeRepository } from '../repositories/eventTypeRepository';
import { EventRepository, EventFilterOptions } from '../repositories/eventRepository';
import { BookingRepository } from '../repositories/bookingRepository';
import { IEventType, IEvent, IBooking, EventStatus } from '../types/index';
import { AuthError } from './otpService';
import { EventValidator } from '../utils/eventValidator';
import { logger } from '../utils/logger';

export class EventService {
  // ──────────────────────────────────────────────────────────────────────────
  // EVENT TYPES CRUD
  // ──────────────────────────────────────────────────────────────────────────

  public static async createEventType(data: {
    name: string;
    code?: string;
    description?: string;
    icon_url?: string;
    banner_url?: string;
    suggested_budget_min?: number;
    suggested_budget_max?: number;
    default_guest_count?: number;
    is_active?: boolean;
  }): Promise<IEventType> {
    if (!data.name || !data.name.trim()) {
      throw new AuthError('Event type name is required', 400);
    }

    const code = (data.code || data.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')).toLowerCase();

    const existing = await EventTypeRepository.findByCode(code);
    if (existing) {
      throw new AuthError(`Event type with code "${code}" already exists`, 409);
    }

    const eventType = await EventTypeRepository.create({
      ...data,
      name: data.name.trim(),
      code,
    });

    logger.info(`[Event Types] Created new event type: "${eventType.name}" (${eventType.code})`);
    return eventType;
  }

  public static async getAllEventTypes(filter?: { is_active?: boolean }): Promise<IEventType[]> {
    return EventTypeRepository.findAll(filter);
  }

  public static async getEventTypeById(id: string): Promise<IEventType> {
    const eventType = await EventTypeRepository.findById(id);
    if (!eventType) {
      throw new AuthError(`Event type with ID "${id}" not found`, 404);
    }
    return eventType;
  }

  public static async updateEventType(
    id: string,
    data: Partial<Omit<IEventType, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<IEventType> {
    const existing = await EventTypeRepository.findById(id);
    if (!existing) {
      throw new AuthError(`Event type with ID "${id}" not found`, 404);
    }

    if (data.code && data.code !== existing.code) {
      const codeConflict = await EventTypeRepository.findByCode(data.code);
      if (codeConflict && codeConflict.id !== id) {
        throw new AuthError(`Event type with code "${data.code}" already exists`, 409);
      }
    }

    const updated = await EventTypeRepository.update(id, data);
    if (!updated) {
      throw new AuthError('Failed to update event type', 500);
    }

    logger.info(`[Event Types] Updated event type: "${updated.name}" (${updated.id})`);
    return updated;
  }

  public static async deleteEventType(id: string): Promise<{ deleted: boolean; id: string }> {
    const existing = await EventTypeRepository.findById(id);
    if (!existing) {
      throw new AuthError(`Event type with ID "${id}" not found`, 404);
    }

    const deleted = await EventTypeRepository.delete(id);
    logger.info(`[Event Types] Deleted event type "${existing.name}" (${id})`);
    return { deleted, id };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // USER EVENTS CRUD (Customer-facing with JWT ownership & Validation)
  // ──────────────────────────────────────────────────────────────────────────

  public static async createEvent(
    userId: string,
    data: {
      event_type_id?: string;
      event_type?: string;
      title: string;
      description?: string;
      event_date: string;
      start_time?: string;
      end_time?: string;
      city?: string;
      location?: string;
      venue_name?: string;
      venue_address?: string;
      venue_latitude?: number;
      venue_longitude?: number;
      guest_count: number;
      estimated_budget: number;
      actual_spent?: number;
      notes?: string;
      status?: EventStatus;
    }
  ): Promise<IEvent> {
    // 1. Strict Payload Validation
    EventValidator.validateCreateEvent(data);

    let eventTypeName = data.event_type;
    if (data.event_type_id) {
      const eventType = await EventTypeRepository.findById(data.event_type_id);
      if (eventType) {
        eventTypeName = eventType.name;
      }
    }

    const city = data.city?.trim() || data.location?.trim() || 'Hyderabad';
    const location = data.location?.trim() || data.venue_address?.trim() || city;

    const newEvent = await EventRepository.create({
      ...data,
      user_id: userId,
      event_type: eventTypeName,
      city,
      location,
      guest_count: Number(data.guest_count),
      estimated_budget: Number(data.estimated_budget),
    });

    logger.info(
      `[Events] Created event "${newEvent.title}" on ${newEvent.event_date} in ${newEvent.city} (${newEvent.guest_count} guests, ₹${newEvent.estimated_budget}) for user ${userId}`
    );
    return newEvent;
  }

  public static async getUserEvents(userId: string, filter?: EventFilterOptions): Promise<IEvent[]> {
    return EventRepository.findAllByUserId(userId, filter);
  }

  public static async getEventById(userId: string, eventId: string): Promise<IEvent> {
    const event = await EventRepository.findById(eventId);
    if (!event) {
      throw new AuthError(`Event with ID "${eventId}" not found`, 404);
    }

    if (event.user_id !== userId) {
      throw new AuthError('Forbidden: You do not have access to this event', 403);
    }

    // Attach related booking history
    const allBookings = await BookingRepository.findByClientId(userId);
    const eventBookings = allBookings.filter(
      (b) => b.event_date === event.event_date || (event.venue_address && b.venue_address === event.venue_address)
    );

    return {
      ...event,
      booking_history: eventBookings,
    };
  }

  public static async updateEvent(
    userId: string,
    eventId: string,
    data: Partial<Omit<IEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<IEvent> {
    // 1. Validate update payload
    EventValidator.validateUpdateEvent(data);

    const existing = await EventRepository.findById(eventId);
    if (!existing) {
      throw new AuthError(`Event with ID "${eventId}" not found`, 404);
    }

    if (existing.user_id !== userId) {
      throw new AuthError('Forbidden: You can only update your own events', 403);
    }

    if (data.event_type_id && data.event_type_id !== existing.event_type_id) {
      const eventType = await EventTypeRepository.findById(data.event_type_id);
      if (eventType) {
        data.event_type = eventType.name;
      }
    }

    const updated = await EventRepository.update(eventId, {
      ...data,
      ...(data.guest_count !== undefined && { guest_count: Number(data.guest_count) }),
      ...(data.estimated_budget !== undefined && { estimated_budget: Number(data.estimated_budget) }),
    });

    if (!updated) {
      throw new AuthError('Failed to update event', 500);
    }

    logger.info(`[Events] Updated event "${updated.title}" (${eventId}) for user ${userId}`);
    return updated;
  }

  public static async deleteEvent(userId: string, eventId: string): Promise<{ deleted: boolean; id: string }> {
    const existing = await EventRepository.findById(eventId);
    if (!existing) {
      throw new AuthError(`Event with ID "${eventId}" not found`, 404);
    }

    if (existing.user_id !== userId) {
      throw new AuthError('Forbidden: You can only delete your own events', 403);
    }

    const deleted = await EventRepository.delete(eventId);
    logger.info(`[Events] Deleted event "${existing.title}" (${eventId}) by user ${userId}`);
    return { deleted, id: eventId };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // BOOKING HISTORY MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Retrieves all bookings for a user across all events
   */
  public static async getUserBookingHistory(userId: string): Promise<{
    total_bookings: number;
    bookings: IBooking[];
  }> {
    const bookings = await BookingRepository.findByClientId(userId);
    return {
      total_bookings: bookings.length,
      bookings,
    };
  }

  /**
   * Retrieves bookings specifically tied to an event ID
   */
  public static async getEventBookings(userId: string, eventId: string): Promise<{
    event_id: string;
    event_title: string;
    event_date: string;
    bookings: IBooking[];
  }> {
    const event = await this.getEventById(userId, eventId);
    const allBookings = await BookingRepository.findByClientId(userId);
    const eventBookings = allBookings.filter(
      (b) => b.event_date === event.event_date || (event.venue_address && b.venue_address === event.venue_address)
    );

    return {
      event_id: event.id,
      event_title: event.title,
      event_date: event.event_date,
      bookings: eventBookings,
    };
  }
}

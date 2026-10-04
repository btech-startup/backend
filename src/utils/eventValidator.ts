import { AuthError } from '../services/otpService';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export class EventValidator {
  /**
   * Validate Event Creation Payload (POST)
   */
  public static validateCreateEvent(body: any): void {
    const errors: ValidationErrorItem[] = [];

    // 1. Title
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title is required and must be at least 3 characters' });
    }

    // 2. Event Date
    if (!body.event_date) {
      errors.push({ field: 'event_date', message: 'Event date is required (YYYY-MM-DD)' });
    } else {
      const dateStr = String(body.event_date).trim();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        errors.push({ field: 'event_date', message: 'Event date must follow the format YYYY-MM-DD (e.g. 2026-12-15)' });
      } else {
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
          errors.push({ field: 'event_date', message: 'Event date must be a valid calendar date' });
        }
      }
    }

    // 3. Location / City
    const city = body.city?.trim();
    const location = body.location?.trim();
    const venueAddress = body.venue_address?.trim();
    if (!city && !location && !venueAddress) {
      errors.push({
        field: 'city',
        message: 'Location or City is required (please provide city, location, or venue_address)',
      });
    }

    // 4. Guest Count
    if (body.guest_count === undefined || body.guest_count === null) {
      errors.push({ field: 'guest_count', message: 'Guest count is required (minimum 1)' });
    } else {
      const guests = Number(body.guest_count);
      if (!Number.isInteger(guests) || guests < 1) {
        errors.push({ field: 'guest_count', message: 'Guest count must be an integer of at least 1' });
      } else if (guests > 100000) {
        errors.push({ field: 'guest_count', message: 'Guest count cannot exceed 100,000 attendees' });
      }
    }

    // 5. Estimated Budget
    if (body.estimated_budget === undefined || body.estimated_budget === null) {
      errors.push({ field: 'estimated_budget', message: 'Estimated budget is required (in INR)' });
    } else {
      const budget = Number(body.estimated_budget);
      if (isNaN(budget) || budget < 0) {
        errors.push({ field: 'estimated_budget', message: 'Estimated budget must be a non-negative number' });
      }
    }

    if (errors.length > 0) {
      const err = new AuthError(`Validation failed: ${errors.map((e) => e.message).join('; ')}`, 400);
      (err as any).errors = errors;
      throw err;
    }
  }

  /**
   * Validate Event Update Payload (PUT/PATCH)
   */
  public static validateUpdateEvent(body: any): void {
    const errors: ValidationErrorItem[] = [];

    // Title (if provided)
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length < 3) {
        errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
      }
    }

    // Event Date (if provided)
    if (body.event_date !== undefined) {
      const dateStr = String(body.event_date).trim();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        errors.push({ field: 'event_date', message: 'Event date must follow the format YYYY-MM-DD' });
      } else {
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
          errors.push({ field: 'event_date', message: 'Event date must be a valid calendar date' });
        }
      }
    }

    // Guest Count (if provided)
    if (body.guest_count !== undefined) {
      const guests = Number(body.guest_count);
      if (!Number.isInteger(guests) || guests < 1) {
        errors.push({ field: 'guest_count', message: 'Guest count must be an integer of at least 1' });
      }
    }

    // Estimated Budget (if provided)
    if (body.estimated_budget !== undefined) {
      const budget = Number(body.estimated_budget);
      if (isNaN(budget) || budget < 0) {
        errors.push({ field: 'estimated_budget', message: 'Estimated budget must be a non-negative number' });
      }
    }

    // Status (if provided)
    if (body.status !== undefined) {
      const validStatuses = ['planning', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        errors.push({
          field: 'status',
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }
    }

    if (errors.length > 0) {
      const err = new AuthError(`Validation failed: ${errors.map((e) => e.message).join('; ')}`, 400);
      (err as any).errors = errors;
      throw err;
    }
  }
}

import { Router } from 'express';
import { EventController } from '../controllers/eventController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// ──────────────────────────────────────────────────────────────────────────
// EVENT TYPE CRUD ROUTES
// ──────────────────────────────────────────────────────────────────────────

// Create new event type
router.post('/types', EventController.createEventType);

// Get all event types (optional ?is_active=true query)
router.get('/types', EventController.getAllEventTypes);

// Get single event type by ID
router.get('/types/:id', EventController.getEventTypeById);

// Update event type by ID
router.put('/types/:id', EventController.updateEventType);
router.patch('/types/:id', EventController.updateEventType);

// Delete event type by ID
router.delete('/types/:id', EventController.deleteEventType);

// ──────────────────────────────────────────────────────────────────────────
// BOOKING HISTORY ROUTES (Placed before /:id parameter)
// ──────────────────────────────────────────────────────────────────────────

// Get authenticated user's complete booking history across all events
router.get('/bookings/history', authenticate, EventController.getUserBookingHistory);

// ──────────────────────────────────────────────────────────────────────────
// USER EVENTS CRUD ROUTES (Secured by JWT Authorization Middleware)
// ──────────────────────────────────────────────────────────────────────────

// Create new event for authenticated user (with validation for date, city/location, guest count, budget)
router.post('/', authenticate, EventController.createEvent);

// Get all events for authenticated user (supports filters: city, location, event_date, guest range, budget range, status)
router.get('/', authenticate, EventController.getUserEvents);

// Get single event by ID (includes embedded booking history)
router.get('/:id', authenticate, EventController.getEventById);

// Get bookings specifically for an event
router.get('/:id/bookings', authenticate, EventController.getEventBookings);

// Update event details (with validation for date, city/location, guest count, budget)
router.put('/:id', authenticate, EventController.updateEvent);
router.patch('/:id', authenticate, EventController.updateEvent);

// Delete event (must belong to authenticated user)
router.delete('/:id', authenticate, EventController.deleteEvent);

export default router;

import { Router } from 'express';
import {
  VendorController,
  updateVendorProfileSchema,
} from '../controllers/vendor.controller';
import {
  CalendarController,
  blockDatesSchema,
} from '../controllers/calendar.controller';
import { authenticateVendor } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

// Secure all vendor profile & dashboard routes
router.use(authenticateVendor);

/**
 * @swagger
 * /api/v1/vendor/profile:
 *   get:
 *     summary: Get profile of authenticated vendor
 *     security:
 *       - bearerAuth: []
 *     tags: [Vendor Profile & Dashboard]
 *     responses:
 *       200:
 *         description: Vendor profile retrieved successfully
 */
router.get('/profile', VendorController.getProfile);

/**
 * @swagger
 * /api/v1/vendor/profile:
 *   put:
 *     summary: Update vendor profile details (Business name, category, address, etc.)
 *     security:
 *       - bearerAuth: []
 *     tags: [Vendor Profile & Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *                 example: "Royal Grand Decorators & Events"
 *               ownerName:
 *                 type: string
 *                 example: "Vikram Sharma"
 *               category:
 *                 type: string
 *                 enum: [CATERING, PHOTOGRAPHY, DECORATION, VENUE, SOUND_DJ, MAKEUP_ARTIST, EVENT_PLANNER]
 *                 example: "DECORATION"
 *               email:
 *                 type: string
 *                 example: "contact@royalgrandevents.com"
 *               bio:
 *                 type: string
 *                 example: "Premier luxury wedding and event decorators with 10+ years of royal theme creations."
 *               experienceYears:
 *                 type: integer
 *                 example: 10
 *               address:
 *                 type: string
 *                 example: "42 MG Road, Indiranagar"
 *               city:
 *                 type: string
 *                 example: "Bangalore"
 *               state:
 *                 type: string
 *                 example: "Karnataka"
 *               pincode:
 *                 type: string
 *                 example: "560038"
 *               profileImage:
 *                 type: string
 *                 example: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800"
 *               portfolioUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://images.unsplash.com/photo-1519741497674-611481863552?w=800"]
 *     responses:
 *       200:
 *         description: Vendor profile updated successfully
 */
router.put(
  '/profile',
  validateRequest(updateVendorProfileSchema),
  VendorController.updateProfile
);

/**
 * @swagger
 * /api/v1/vendor/dashboard/stats:
 *   get:
 *     summary: Get vendor dashboard overview and quick statistics
 *     security:
 *       - bearerAuth: []
 *     tags: [Vendor Profile & Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
 */
router.get('/dashboard/stats', VendorController.getDashboardStats);

/**
 * @swagger
 * /api/v1/vendor/calendar:
 *   get:
 *     summary: Get vendor's personal event schedule, bookings, and blocked dates
 *     security:
 *       - bearerAuth: []
 *     tags: [Vendor Calendar & Event Availability]
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: "Month in YYYY-MM format (e.g. 2026-12)"
 *         example: "2026-12"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         example: "2026-12-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Full vendor schedule with client details, deal links, and summary
 */
router.get('/calendar', CalendarController.getVendorCalendarProtected);

/**
 * @swagger
 * /api/v1/vendor/calendar/block:
 *   post:
 *     summary: Block date(s) on calendar for personal leave, maintenance, or external bookings
 *     security:
 *       - bearerAuth: []
 *     tags: [Vendor Calendar & Event Availability]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 description: "Target start date (YYYY-MM-DD)"
 *                 example: "2026-11-10"
 *               endDate:
 *                 type: string
 *                 description: "Optional target end date for date ranges (YYYY-MM-DD)"
 *                 example: "2026-11-12"
 *               title:
 *                 type: string
 *                 example: "Venue Maintenance & Renovation"
 *               eventType:
 *                 type: string
 *                 example: "MAINTENANCE"
 *               notes:
 *                 type: string
 *                 example: "Audio equipment servicing and studio maintenance"
 *               slotType:
 *                 type: string
 *                 enum: [FULL_DAY, MORNING, EVENING]
 *                 example: "FULL_DAY"
 *     responses:
 *       200:
 *         description: Date(s) successfully marked as blocked
 */
router.post(
  '/calendar/block',
  validateRequest(blockDatesSchema),
  CalendarController.blockDatesProtected
);

/**
 * @swagger
 * /api/v1/vendor/calendar/{id}:
 *   delete:
 *     summary: Unblock a date and restore availability
 *     security:
 *       - bearerAuth: []
 *     tags: [Vendor Calendar & Event Availability]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Calendar entry ID
 *     responses:
 *       200:
 *         description: Date unblocked successfully
 */
router.delete('/calendar/:id', CalendarController.unblockDateProtected);

/**
 * @swagger
 * /api/v1/vendor/calendar/verify-date:
 *   get:
 *     summary: Quick date availability check for vendor
 *     security:
 *       - bearerAuth: []
 *     tags: [Vendor Calendar & Event Availability]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *         example: "2026-12-15"
 *       - in: query
 *         name: slotType
 *         schema:
 *           type: string
 *           enum: [FULL_DAY, MORNING, EVENING]
 *         example: "FULL_DAY"
 *     responses:
 *       200:
 *         description: Verification result with conflict details
 */
router.get('/calendar/verify-date', CalendarController.verifyDateProtected);

export default router;

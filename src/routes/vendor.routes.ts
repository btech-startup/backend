import { Router } from 'express';
import {
  VendorController,
  updateVendorProfileSchema,
} from '../controllers/vendor.controller';
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

export default router;

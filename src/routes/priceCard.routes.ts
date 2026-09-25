import { Router } from 'express';
import {
  PriceCardController,
  createPriceCardSchema,
  updatePriceCardSchema,
} from '../controllers/priceCard.controller';
import { authenticateVendor } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

// Protect all price card routes with vendor authentication
router.use(authenticateVendor);

/**
 * @swagger
 * /api/v1/vendor/price-card/public/{vendorId}:
 *   get:
 *     summary: View a vendor's published price cards
 *     security:
 *       - bearerAuth: []
 *     tags: [Price Card (Rate Card)]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *         example: "70421caf-a7ef-4cad-9960-48ba6fabf7a7"
 *         description: "Vendor ID (e.g. Royal Grand Decorators: 70421caf-a7ef-4cad-9960-48ba6fabf7a7)"
 *     responses:
 *       200:
 *         description: List of vendor active price card packages
 *       401:
 *         description: Authentication token is missing or malformed
 */
router.get('/public/:vendorId', PriceCardController.getPublicPriceCards);

/**
 * @swagger
 * /api/v1/vendor/price-card:
 *   post:
 *     summary: Create a new service price card / package
 *     security:
 *       - bearerAuth: []
 *     tags: [Price Card (Rate Card)]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Royal Mandap & Floral Stage Decor Package"
 *               category:
 *                 type: string
 *                 example: "DECORATION"
 *               price:
 *                 type: number
 *                 example: 85000
 *               pricingUnit:
 *                 type: string
 *                 enum: [PER_EVENT, PER_DAY, PER_HOUR, PER_PLATE, FIXED]
 *                 example: "PER_EVENT"
 *               inclusions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Exotic floral backdrop", "Red carpet with 12 lit pillars", "Warm spotlights", "Royal bride & groom sofa"]
 *               terms:
 *                 type: string
 *                 example: "30% advance on booking, 70% post installation on event morning."
 *     responses:
 *       201:
 *         description: Price card created successfully
 */
router.post(
  '/',
  validateRequest(createPriceCardSchema),
  PriceCardController.createPriceCard
);

/**
 * @swagger
 * /api/v1/vendor/price-card:
 *   get:
 *     summary: Get all price cards belonging to authenticated vendor
 *     security:
 *       - bearerAuth: []
 *     tags: [Price Card (Rate Card)]
 *     responses:
 *       200:
 *         description: List of price cards
 */
router.get('/', PriceCardController.getVendorPriceCards);

/**
 * @swagger
 * /api/v1/vendor/price-card/{id}:
 *   get:
 *     summary: Get a single price card by ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Price Card (Rate Card)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "pc-royal-decor-01"
 *     responses:
 *       200:
 *         description: Price card details
 */
router.get('/:id', PriceCardController.getPriceCardById);

/**
 * @swagger
 * /api/v1/vendor/price-card/{id}:
 *   put:
 *     summary: Update an existing price card package
 *     security:
 *       - bearerAuth: []
 *     tags: [Price Card (Rate Card)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "pc-royal-decor-01"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *                 example: 95000
 *               terms:
 *                 type: string
 *                 example: "20% advance booking deposit, balance upon event morning setup."
 *     responses:
 *       200:
 *         description: Price card updated successfully
 */
router.put(
  '/:id',
  validateRequest(updatePriceCardSchema),
  PriceCardController.updatePriceCard
);

/**
 * @swagger
 * /api/v1/vendor/price-card/{id}:
 *   delete:
 *     summary: Delete a price card package
 *     security:
 *       - bearerAuth: []
 *     tags: [Price Card (Rate Card)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "pc-royal-decor-02"
 *     responses:
 *       200:
 *         description: Price card deleted successfully
 */
router.delete('/:id', PriceCardController.deletePriceCard);

export default router;

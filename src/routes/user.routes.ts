import { Router } from 'express';
import {
  UserController,
  createChatbotDealSchema,
  negotiateDealSchema,
} from '../controllers/user.controller';
import { validateRequest } from '../middlewares/validate.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/user/sample-vendors:
 *   get:
 *     summary: Get curated sample vendors with ready-to-test credentials, IDs, and deal payloads
 *     tags: [User Experience & Directory]
 *     responses:
 *       200:
 *         description: List of sample vendors with test configuration parameters
 */
router.get('/sample-vendors', UserController.getSampleVendors);

/**
 * @swagger
 * /api/v1/user/vendors:
 *   get:
 *     summary: Browse all verified vendors with filtering, search, ratings, and price cards
 *     tags: [User Experience & Directory]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [DECORATION, CATERING, PHOTOGRAPHY, SOUND_DJ, MAKEUP_ARTIST, VENUE]
 *         example: "DECORATION"
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         example: "Bangalore"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         example: "Royal"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated vendor list
 */
router.get('/vendors', UserController.listVendors);

/**
 * @swagger
 * /api/v1/user/vendors/{id}:
 *   get:
 *     summary: Get vendor public profile, portfolio, active price packages, and integration values (banking + chatbot)
 *     tags: [User Experience & Directory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "70421caf-a7ef-4cad-9960-48ba6fabf7a7"
 *     responses:
 *       200:
 *         description: Detailed public vendor profile
 */
router.get('/vendors/:id', UserController.getVendorDetail);

/**
 * @swagger
 * /api/v1/user/vendors/{id}/banking:
 *   get:
 *     summary: Retrieve verified vendor banking & UPI settlement details for bookings
 *     tags: [User Experience & Directory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "70421caf-a7ef-4cad-9960-48ba6fabf7a7"
 *     responses:
 *       200:
 *         description: Verified banking details and payment schedule
 */
router.get('/vendors/:id/banking', UserController.getVendorBanking);

/**
 * @swagger
 * /api/v1/user/deals/chatbot:
 *   post:
 *     summary: Initiate a deal negotiation with the AI Chatbot Assistant for an event package
 *     tags: [Chatbot & Deal Negotiation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vendorId, clientName, clientPhone, eventType]
 *             properties:
 *               vendorId:
 *                 type: string
 *                 example: "70421caf-a7ef-4cad-9960-48ba6fabf7a7"
 *               priceCardId:
 *                 type: string
 *                 example: "pc-royal-decor-01"
 *               clientName:
 *                 type: string
 *                 example: "Aisha Kapoor"
 *               clientPhone:
 *                 type: string
 *                 example: "+919811122233"
 *               clientEmail:
 *                 type: string
 *                 example: "aisha.kapoor@example.com"
 *               eventType:
 *                 type: string
 *                 example: "Wedding & Reception"
 *               eventDate:
 *                 type: string
 *                 example: "2026-12-15"
 *               guestCount:
 *                 type: integer
 *                 example: 500
 *               offeredPrice:
 *                 type: number
 *                 example: 75000
 *               userMessage:
 *                 type: string
 *                 example: "Hi! We love your Royal Mandap decor. Can you offer a package discount to ₹75,000 for our 500-guest wedding?"
 *     responses:
 *       201:
 *         description: Chatbot deal session created with instant AI response and payment breakdown
 */
router.post(
  '/deals/chatbot',
  validateRequest(createChatbotDealSchema),
  UserController.startChatbotDeal
);

/**
 * @swagger
 * /api/v1/user/deals/{dealId}/negotiate:
 *   post:
 *     summary: Send counter-offer or message in ongoing chatbot deal negotiation
 *     tags: [Chatbot & Deal Negotiation]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         example: "deal-sample-wedding-royal-01"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userMessage]
 *             properties:
 *               userMessage:
 *                 type: string
 *                 example: "Can we lock in at ₹75,000 if we pay the 30% advance right now?"
 *               counterOffer:
 *                 type: number
 *                 example: 75000
 *     responses:
 *       200:
 *         description: Chatbot reply and updated deal state
 */
router.post(
  '/deals/:dealId/negotiate',
  validateRequest(negotiateDealSchema),
  UserController.negotiateDeal
);

/**
 * @swagger
 * /api/v1/user/deals/{dealId}:
 *   get:
 *     summary: Get complete deal summary, negotiation chat history, and banking payment instructions
 *     tags: [Chatbot & Deal Negotiation]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         example: "deal-sample-wedding-royal-01"
 *     responses:
 *       200:
 *         description: Deal details, agreed terms, and payment settlement instructions
 */
router.get('/deals/:dealId', UserController.getDeal);

export default router;

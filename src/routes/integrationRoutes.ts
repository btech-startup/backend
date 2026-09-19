import { Router } from 'express';
import { IntegrationController } from '../controllers/integrationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Webhook without auth
router.post('/payments/webhook', IntegrationController.paymentWebhook);

// Protected routes
router.use(authenticate);

router.post('/payments/initiate', IntegrationController.initiatePayment);
router.post('/payments/verify', IntegrationController.verifyPayment);
router.post('/upload', IntegrationController.uploadFile);
router.post('/geocode', IntegrationController.geocode);

export default router;

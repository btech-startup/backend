import { Router } from 'express';
import { PaymentWebhookController } from '../controllers/paymentWebhookController';

const router = Router();

// Webhook endpoint (public with cryptographic signature verification)
router.post('/webhook', PaymentWebhookController.handleWebhook);

export default router;

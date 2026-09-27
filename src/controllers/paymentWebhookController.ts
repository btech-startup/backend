import { Request, Response } from 'express';
import { PaymentWebhookService } from '../services/paymentWebhookService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class PaymentWebhookController {
  /**
   * POST /api/v1/payments/webhook
   * Public gateway webhook endpoint with cryptographic verification
   */
  public static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature =
        (req.headers['x-razorpay-signature'] as string) ||
        (req.headers['x-webhook-signature'] as string) ||
        (req.headers['x-signature'] as string) ||
        '';

      const provider = (req.query.provider as string) || 'razorpay';
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      const result = await PaymentWebhookService.processWebhook(
        rawBody,
        signature,
        req.body,
        provider
      );

      sendSuccess(res, 'Payment webhook processed successfully', result);
    } catch (error: any) {
      if (error.statusCode === 401) {
        sendError(res, error.message, 401);
        return;
      }
      sendError(res, error.message || 'Payment webhook processing failed', 500);
    }
  }
}

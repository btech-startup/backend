import { Request, Response } from 'express';
import { IntegrationService } from '../services/integrationService';
import { sendSuccess, sendError } from '../utils/apiResponse';

export class IntegrationController {
  static async paymentWebhook(req: Request, res: Response) {
    try {
      const provider = req.query.provider as string || 'default';
      const result = await IntegrationService.processPaymentWebhook(provider, req.body);
      sendSuccess(res, 'Webhook processed', result);
    } catch (error: any) {
      sendError(res, 'Failed to process webhook', 500, error.message);
    }
  }

  static async initiatePayment(req: Request, res: Response) {
    try {
      const { amount, orderId, customerPhone, description } = req.body;
      const result = await IntegrationService.initiatePayment(amount, orderId, customerPhone, description);
      sendSuccess(res, 'Payment initiated', result);
    } catch (error: any) {
      sendError(res, 'Failed to initiate payment', 500, error.message);
    }
  }

  static async verifyPayment(req: Request, res: Response) {
    try {
      const { paymentId, orderId, signature } = req.body;
      const result = await IntegrationService.verifyPayment(paymentId, orderId, signature);
      sendSuccess(res, 'Payment verified', result);
    } catch (error: any) {
      sendError(res, 'Failed to verify payment', 500, error.message);
    }
  }

  static async uploadFile(req: Request, res: Response) {
    try {
      // Mock upload handler assuming file in req.body.file or something
      const fileBuffer = Buffer.from('mock');
      const fileName = req.body.fileName || `file_${Date.now()}.txt`;
      const mimeType = req.body.mimeType || 'text/plain';
      
      const result = await IntegrationService.uploadToStorage(fileBuffer, fileName, mimeType);
      sendSuccess(res, 'File uploaded', result);
    } catch (error: any) {
      sendError(res, 'Failed to upload file', 500, error.message);
    }
  }

  static async geocode(req: Request, res: Response) {
    try {
      const { address } = req.body;
      const result = await IntegrationService.geocodeAddress(address);
      sendSuccess(res, 'Address geocoded', result);
    } catch (error: any) {
      sendError(res, 'Failed to geocode address', 500, error.message);
    }
  }
}

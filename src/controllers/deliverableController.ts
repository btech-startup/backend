import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { DeliverableService } from '../services/deliverableService';

export class DeliverableController {
  static async create(req: Request, res: Response) {
    try {
      const deliverable = await DeliverableService.createDeliverable(req.body);
      return sendSuccess(res, 'Deliverable created successfully', deliverable);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to create deliverable', 500, error);
    }
  }

  static async submit(req: Request, res: Response) {
    try {
      const vendorId = (req as any).user.id;
      const { id } = req.params;
      const { fileUrls } = req.body;
      const deliverable = await DeliverableService.submitDeliverable(id, vendorId, fileUrls);
      return sendSuccess(res, 'Deliverable submitted successfully', deliverable);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to submit deliverable', 500, error);
    }
  }

  static async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reviewerNotes } = req.body;
      const deliverable = await DeliverableService.approveDeliverable(id, reviewerNotes);
      return sendSuccess(res, 'Deliverable approved successfully', deliverable);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to approve deliverable', 500, error);
    }
  }

  static async requestRevision(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const deliverable = await DeliverableService.requestRevision(id, notes);
      return sendSuccess(res, 'Revision requested successfully', deliverable);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to request revision', 500, error);
    }
  }

  static async getByBooking(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;
      const deliverables = await DeliverableService.getBookingDeliverables(bookingId);
      return sendSuccess(res, 'Deliverables retrieved successfully', deliverables);
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to retrieve deliverables', 500, error);
    }
  }
}

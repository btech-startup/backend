import { NotificationRepository } from '../repositories/notificationRepository';
import { NotificationType } from '../types/index';

export class NotificationService {
  static async sendPushNotification(targetToken: string, title: string, body: string, data?: any): Promise<boolean> {
    console.log(`[Push Notification] To: ${targetToken} | Title: ${title} | Body: ${body}`);
    return true;
  }

  static async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    console.log(`[Email] To: ${to} | Subject: ${subject}`);
    return true;
  }

  static async createInAppNotification(data: { user_id: string; type: string; title: string; body: string; data?: any }) {
    return await NotificationRepository.create(data);
  }

  static async notifyBookingCreated(clientId: string, vendorUserId: string, bookingRef: string) {
    await this.createInAppNotification({
      user_id: clientId,
      type: 'BOOKING_CREATED',
      title: 'Booking Created',
      body: `Your booking ${bookingRef} has been created successfully.`,
      data: { bookingRef }
    });

    await this.createInAppNotification({
      user_id: vendorUserId,
      type: 'BOOKING_CREATED',
      title: 'New Booking Received',
      body: `You have received a new booking: ${bookingRef}.`,
      data: { bookingRef }
    });
  }

  static async notifyPaymentReceived(vendorUserId: string, amount: number, bookingRef: string) {
    await this.createInAppNotification({
      user_id: vendorUserId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      body: `You have received a payment of ${amount} for booking ${bookingRef}.`,
      data: { amount, bookingRef }
    });
  }

  static async notifyMilestoneReleased(vendorUserId: string, stage: string, amount: number, bookingRef: string) {
    await this.createInAppNotification({
      user_id: vendorUserId,
      type: 'MILESTONE_RELEASED',
      title: 'Milestone Released',
      body: `Milestone ${stage} of ${amount} released for booking ${bookingRef}.`,
      data: { stage, amount, bookingRef }
    });
  }

  static async notifyCheckinVerified(clientId: string, vendorUserId: string, bookingRef: string) {
    await this.createInAppNotification({
      user_id: clientId,
      type: 'CHECKIN_VERIFIED',
      title: 'Check-in Verified',
      body: `Vendor has successfully checked in for booking ${bookingRef}.`,
      data: { bookingRef }
    });

    await this.createInAppNotification({
      user_id: vendorUserId,
      type: 'CHECKIN_VERIFIED',
      title: 'Check-in Verified',
      body: `Your check-in for booking ${bookingRef} has been verified.`,
      data: { bookingRef }
    });
  }

  static async notifyDeliverableSubmitted(clientId: string, bookingRef: string) {
    await this.createInAppNotification({
      user_id: clientId,
      type: 'DELIVERABLE_SUBMITTED',
      title: 'Deliverables Submitted',
      body: `Vendor has submitted deliverables for booking ${bookingRef}.`,
      data: { bookingRef }
    });
  }

  static async notifyDeliverableApproved(vendorUserId: string, bookingRef: string) {
    await this.createInAppNotification({
      user_id: vendorUserId,
      type: 'DELIVERABLE_APPROVED',
      title: 'Deliverables Approved',
      body: `Your deliverables for booking ${bookingRef} have been approved.`,
      data: { bookingRef }
    });
  }

  static async notifyDisputeRaised(clientId: string, vendorUserId: string, bookingRef: string) {
    await this.createInAppNotification({
      user_id: clientId,
      type: 'DISPUTE_RAISED',
      title: 'Dispute Raised',
      body: `A dispute has been raised for booking ${bookingRef}.`,
      data: { bookingRef }
    });

    await this.createInAppNotification({
      user_id: vendorUserId,
      type: 'DISPUTE_RAISED',
      title: 'Dispute Raised',
      body: `A dispute has been raised for booking ${bookingRef}.`,
      data: { bookingRef }
    });
  }

  static async notifyDisputeResolved(clientId: string, vendorUserId: string, bookingRef: string, refundAmount: number) {
    await this.createInAppNotification({
      user_id: clientId,
      type: 'DISPUTE_RESOLVED',
      title: 'Dispute Resolved',
      body: `Dispute for booking ${bookingRef} has been resolved. Refund: ${refundAmount}.`,
      data: { bookingRef, refundAmount }
    });

    await this.createInAppNotification({
      user_id: vendorUserId,
      type: 'DISPUTE_RESOLVED',
      title: 'Dispute Resolved',
      body: `Dispute for booking ${bookingRef} has been resolved.`,
      data: { bookingRef }
    });
  }

  static async notifyWalletCredited(userId: string, amount: number) {
    await this.createInAppNotification({
      user_id: userId,
      type: 'WALLET_CREDITED',
      title: 'Wallet Credited',
      body: `Your wallet has been credited with ${amount}.`,
      data: { amount }
    });
  }

  static async notifySOSDispatched(vendorUserId: string, bookingRef: string) {
    await this.createInAppNotification({
      user_id: vendorUserId,
      type: 'SOS_DISPATCHED',
      title: 'SOS Dispatched',
      body: `An SOS request has been dispatched for your booking ${bookingRef}.`,
      data: { bookingRef }
    });
  }

  static async getUserNotifications(userId: string, limit: number = 20, offset: number = 0) {
    return await NotificationRepository.findByUserId(userId, limit, offset);
  }

  static async getUnreadCount(userId: string) {
    return await NotificationRepository.getUnreadCount(userId);
  }

  static async markAsRead(notificationId: string, userId: string) {
    return await NotificationRepository.markAsRead(notificationId, userId);
  }

  static async markAllAsRead(userId: string) {
    return await NotificationRepository.markAllAsRead(userId);
  }
}

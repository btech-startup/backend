import { Request, Response, NextFunction } from 'express';
import { SlotService } from '../services/slotService';
import { sendSuccess } from '../utils/apiResponse';
import { SlotType } from '../types/index';

export class SlotController {
  // Venues
  static async getVenues(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { city, minCapacity } = req.query;
      const venues = SlotService.getVenues(
        city as string,
        minCapacity ? parseInt(minCapacity as string, 10) : undefined
      );
      sendSuccess(res, 'Luxury venues retrieved', venues);
    } catch (error) {
      next(error);
    }
  }

  static async getVenueById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const venue = SlotService.getVenueById(id);
      sendSuccess(res, 'Venue specifications retrieved', venue);
    } catch (error) {
      next(error);
    }
  }

  // BookMyShow-style slots lookup for venue
  static async getVenueSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { month } = req.query;
      const result = SlotService.getVenueSlots(id, (month as string) || '2026-10');
      sendSuccess(res, 'BookMyShow-style slot availability retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  // Modular Services
  static async getModularServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.query;
      const services = SlotService.getModularServices(category as string);
      sendSuccess(res, 'Modular services retrieved', services);
    } catch (error) {
      next(error);
    }
  }

  // Hold slot
  static async reserveSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vendor_id, venue_id, service_id, event_date, slot_type, user_id, host_name, guest_count, advance_amount } = req.body;
      const reservation = SlotService.reserveSlot({
        vendor_id,
        venue_id,
        service_id,
        event_date,
        slot_type: slot_type as SlotType,
        user_id: user_id || (req as any).user?.id || 'usr_customer_demo',
        host_name: host_name || 'Event Host',
        guest_count: Number(guest_count),
        advance_amount: Number(advance_amount)
      });
      sendSuccess(res, 'Slot reserved successfully (15-min hold)', reservation);
    } catch (error: any) {
      if (error.message?.startsWith('SLOT_UNAVAILABLE')) {
        res.status(409).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // Multi-vendor single-cart checkout
  static async checkoutMultiVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = req.body;
      const result = SlotService.checkoutMultiVendor({
        user_id: payload.user_id || (req as any).user?.id || 'usr_customer_demo',
        host_name: payload.host_name || 'Rahul Sharma (Customer)',
        event_date: payload.event_date || '2026-10-15',
        slot_type: (payload.slot_type as SlotType) || 'morning',
        guest_count: Number(payload.guest_count) || 300,
        venue: payload.venue,
        catering: payload.catering,
        photography: payload.photography,
        decor: payload.decor,
        purohit: payload.purohit,
        event_manager: payload.event_manager
      });
      sendSuccess(res, 'Single-Cart Multi-Vendor Escrow Checkout Confirmed', result);
    } catch (error: any) {
      if (error.message?.startsWith('SLOT_UNAVAILABLE')) {
        res.status(409).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  // Vendor Calendar & Slot Management
  static async getVendorCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.params.vendorId || (req as any).user?.id || 'vnd_royal_banquet';
      const calendar = SlotService.getVendorCalendar(vendorId);
      sendSuccess(res, 'Vendor slot calendar retrieved', calendar);
    } catch (error) {
      next(error);
    }
  }

  static async toggleVendorSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { vendor_id, event_date, slot_type, block, venue_id } = req.body;
      const result = SlotService.toggleVendorSlot(
        vendor_id || 'vnd_royal_banquet',
        event_date,
        slot_type as SlotType,
        block === true || block === 'true',
        venue_id
      );
      sendSuccess(res, block ? 'Slot manually blocked for walk-in/maintenance' : 'Slot opened for bookings', result);
    } catch (error) {
      next(error);
    }
  }

  // Admin Master Slot Radar
  static async getAdminSlotRadar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { city, date } = req.query;
      const radar = SlotService.getAdminSlotRadar(city as string, date as string);
      sendSuccess(res, 'Citywide slot availability radar retrieved', radar);
    } catch (error) {
      next(error);
    }
  }

  // Vendor Self-Service Onboarding Wizard
  static async onboardVenue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const venue = SlotService.onboardVenue(req.body);
      sendSuccess(res, 'New partner venue onboarded & submitted for KYC audit', venue);
    } catch (error) {
      next(error);
    }
  }

  // Admin KYC Audit Desk
  static async getKYCApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const apps = SlotService.getKYCApplications();
      sendSuccess(res, 'Merchant KYC audit applications retrieved', apps);
    } catch (error) {
      next(error);
    }
  }

  static async reviewKYCApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = SlotService.reviewKYCApplication(id, status);
      sendSuccess(res, `Merchant KYC status updated to ${status}`, updated);
    } catch (error) {
      next(error);
    }
  }

  // Dispute Tribunal
  static async getDisputes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const disputes = SlotService.getDisputes();
      sendSuccess(res, 'Disputes retrieved', disputes);
    } catch (error) {
      next(error);
    }
  }

  static async createDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dispute = SlotService.createDispute(req.body);
      sendSuccess(res, 'Escrow dispute filed with tribunal', dispute);
    } catch (error) {
      next(error);
    }
  }

  static async resolveDispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { refundAmount, notes } = req.body;
      const result = SlotService.resolveDispute(id, Number(refundAmount), notes);
      sendSuccess(res, 'Dispute tribunal resolution executed', result);
    } catch (error) {
      next(error);
    }
  }

  // Emergency SOS Broadcast & Dispatch
  static async getSOSAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { city } = req.query;
      const alerts = SlotService.getSOSAlerts(city as string);
      sendSuccess(res, 'Active emergency SOS broadcasts retrieved', alerts);
    } catch (error) {
      next(error);
    }
  }

  static async triggerSOS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const alert = SlotService.triggerSOS(req.body);
      sendSuccess(res, 'Emergency SOS broadcast deployed to standby verified partners', alert);
    } catch (error) {
      next(error);
    }
  }

  static async claimSOS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { vendor_id, vendor_name } = req.body;
      const claimed = SlotService.claimSOS(id, vendor_id || 'vnd_royal_banquet', vendor_name || 'Verified Standby Partner');
      sendSuccess(res, 'Emergency replacement job claimed! Escrow milestone locked.', claimed);
    } catch (error) {
      next(error);
    }
  }

  static async dispatchSOS(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { replacement_vendor_id, surge_bonus_percentage, reason } = req.body;
      const result = SlotService.dispatchSOS(
        id,
        replacement_vendor_id || 'vnd_backup_caterer_02',
        Number(surge_bonus_percentage) || 20,
        reason || 'Original vendor delayed'
      );
      sendSuccess(res, '1-Click SOS emergency vendor replacement dispatched', result);
    } catch (error) {
      next(error);
    }
  }

  // Admin Master Dynamic Analytics Engine
  static async getPlatformAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = SlotService.getPlatformAnalytics();
      sendSuccess(res, 'Platform analytics retrieved successfully', analytics);
    } catch (error) {
      next(error);
    }
  }

  // Annadanam Surplus Food Rescue
  static async getFoodDonations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const donations = SlotService.getFoodDonations();
      sendSuccess(res, 'Annadanam food rescue pickup requests retrieved', donations);
    } catch (error) {
      next(error);
    }
  }

  static async dispatchFoodPickup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, ngo, driver_name, driver_phone } = req.body;
      const result = SlotService.dispatchFoodPickup(id, ngo || 'Robin Hood Army', driver_name, driver_phone);
      sendSuccess(res, 'Food rescue NGO dispatch confirmed', result);
    } catch (error) {
      next(error);
    }
  }

  static async updateFoodPickupStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, temperature_celsius } = req.body;
      const result = SlotService.updateFoodPickupStatus(id, status, temperature_celsius ? Number(temperature_celsius) : undefined);
      sendSuccess(res, `Food pickup status updated to ${status}`, result);
    } catch (error) {
      next(error);
    }
  }

  // Anti-Circumvention Chat Audit Log & Sanctions
  static async getChatViolations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const violations = SlotService.getChatViolations();
      sendSuccess(res, 'Anti-circumvention chat violation logs retrieved', violations);
    } catch (error) {
      next(error);
    }
  }

  static async executeChatAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      const result = SlotService.executeChatAction(id, action, notes);
      sendSuccess(res, `Sanction action '${action}' applied to violation`, result);
    } catch (error) {
      next(error);
    }
  }

  // Double-Entry Nodal Escrow Ledger
  static async getEscrowLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ledger = SlotService.getEscrowLedger();
      sendSuccess(res, 'RBI Nodal Escrow double-entry ledger retrieved', ledger);
    } catch (error) {
      next(error);
    }
  }

  // Admin Master Slot Override (Force-Lock / Force-Release)
  static async overrideSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { venue_id, event_date, slot_type, action, reason } = req.body;
      const result = SlotService.adminOverrideSlot(
        venue_id,
        event_date,
        slot_type as SlotType,
        action,
        reason
      );
      sendSuccess(res, `Slot successfully ${action === 'force_lock' ? 'locked' : 'released'} by admin override`, result);
    } catch (error) {
      next(error);
    }
  }
}

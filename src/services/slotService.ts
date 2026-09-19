import { SlotRepository } from '../repositories/slotRepository';
import { SlotType } from '../types/index';

export class SlotService {
  static getVenues(city?: string, minCapacity?: number) {
    return SlotRepository.getVenues(city, minCapacity);
  }

  static getVenueById(id: string) {
    const venue = SlotRepository.getVenueById(id);
    if (!venue) throw new Error(`Venue with ID ${id} not found`);
    return venue;
  }

  static getVenueSlots(venueId: string, month: string) {
    return SlotRepository.getVenueSlots(venueId, month);
  }

  static getModularServices(category?: string) {
    return SlotRepository.getServices(category);
  }

  static reserveSlot(params: {
    vendor_id: string;
    venue_id?: string;
    service_id?: string;
    event_date: string;
    slot_type: SlotType;
    user_id: string;
    host_name: string;
    guest_count?: number;
    advance_amount?: number;
  }) {
    return SlotRepository.reserveSlot({
      ...params,
      permanent_booking: false
    });
  }

  // Single-Cart Multi-Vendor Checkout with Escrow Milestone Splitting
  static checkoutMultiVendor(payload: {
    user_id: string;
    host_name: string;
    event_date: string;
    slot_type: SlotType;
    guest_count: number;
    venue?: { id: string; price: number; name: string };
    venue_id?: string;
    venue_name?: string;
    advance_amount?: number;
    catering?: { id: string; per_plate: number; name: string };
    photography?: { id: string; price: number; name: string };
    decor?: { id: string; price: number; name: string };
    purohit?: { id: string; price: number; name: string };
    event_manager?: { id: string; price: number; name: string };
  }) {
    const { user_id, host_name, event_date, slot_type, guest_count, catering, photography, decor, purohit, event_manager } = payload;
    const venue = payload.venue || (payload.venue_id ? { id: payload.venue_id, name: payload.venue_name || 'Grand Kohinoor Convention Center', price: payload.advance_amount || 175000 } : undefined);

    const lockedSlots: any[] = [];
    let grossAmount = 0;

    // 1. Lock Venue Slot if included
    if (venue) {
      grossAmount += venue.price;
      const venueBooking = SlotRepository.reserveSlot({
        vendor_id: 'vnd_royal_banquet',
        venue_id: venue.id,
        event_date,
        slot_type,
        user_id: user_id || 'usr_customer_live',
        host_name: host_name || 'Anand & Pooja (Live Host)',
        guest_count: guest_count || 500,
        advance_amount: Math.round((venue.price || 175000) * 0.20),
        permanent_booking: true
      });
      lockedSlots.push({ item: venue.name, type: 'venue', slot: venueBooking });
    }

    // 2. Add Catering
    if (catering) {
      const cateringTotal = catering.per_plate * guest_count;
      grossAmount += cateringTotal;
      lockedSlots.push({ item: catering.name, type: 'catering', total: cateringTotal });
    }

    // 3. Add Photography
    if (photography) {
      grossAmount += photography.price;
      lockedSlots.push({ item: photography.name, type: 'photography', total: photography.price });
    }

    // 4. Add Decor
    if (decor) {
      grossAmount += decor.price;
      lockedSlots.push({ item: decor.name, type: 'decor', total: decor.price });
    }

    // 5. Add Purohit
    if (purohit) {
      grossAmount += purohit.price;
      lockedSlots.push({ item: purohit.name, type: 'purohit', total: purohit.price });
    }

    // 6. Add Event Manager
    if (event_manager) {
      grossAmount += event_manager.price;
      lockedSlots.push({ item: event_manager.name, type: 'event_manager', total: event_manager.price });
    }

    const bookingRef = `BK-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Milestone Escrow Schedule
    const milestoneSchedule = {
      milestone1_advance_20: {
        stage: 'advance_lock',
        percentage: 20,
        amount: Math.round(grossAmount * 0.20),
        status: 'HELD_IN_NODAL_ESCROW',
        description: 'Locks venue and vendor calendar slots permanently. Held by RBI Nodal Escrow.'
      },
      milestone2_checkin_50: {
        stage: 'event_checkin',
        percentage: 50,
        amount: Math.round(grossAmount * 0.50),
        status: 'PENDING_EVENT_DAY',
        description: 'Auto-released on event day upon Geofenced Check-In (<500m) & Host OTP.'
      },
      milestone3_delivery_30: {
        stage: 'work_delivery',
        percentage: 30,
        amount: Math.round(grossAmount * 0.30),
        status: 'PENDING_AUDIT',
        description: 'Released after 72-hour deliverable audit and final client satisfaction sign-off.'
      }
    };

    return {
      booking_reference: bookingRef,
      event_date,
      slot_type,
      host_name,
      guest_count,
      gross_amount: grossAmount,
      advance_payable_now: milestoneSchedule.milestone1_advance_20.amount,
      milestones: milestoneSchedule,
      locked_items: lockedSlots,
      handshake_otp: `${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date()
    };
  }

  // Vendor Slot Management
  static toggleVendorSlot(vendorId: string, eventDate: string, slotType: SlotType, block: boolean, venueId?: string) {
    return SlotRepository.toggleVendorSlotBlock(vendorId, eventDate, slotType, block, venueId);
  }

  static getVendorCalendar(vendorId: string) {
    return SlotRepository.getVendorCalendar(vendorId);
  }

  // Admin Master Slot Radar
  static getAdminSlotRadar(city?: string, date?: string) {
    return SlotRepository.getAdminSlotRadar(city, date);
  }

  // Vendor Onboarding & KYC Management
  static onboardVenue(data: any) {
    return SlotRepository.addVenue(data);
  }

  static getKYCApplications() {
    return SlotRepository.getKYCApplications();
  }

  static reviewKYCApplication(id: string, status: 'verified' | 'rejected') {
    return SlotRepository.reviewKYCApplication(id, status);
  }

  // Dispute Tribunal Management
  static createDispute(data: any) {
    return SlotRepository.createDispute(data);
  }

  static getDisputes() {
    return SlotRepository.getDisputes();
  }

  static resolveDispute(id: string, refundAmount: number, notes: string) {
    return SlotRepository.resolveDispute(id, refundAmount, notes);
  }

  // Emergency SOS Broadcast & Dispatch
  static triggerSOS(data: any) {
    return SlotRepository.triggerSOS(data);
  }

  static getSOSAlerts(city?: string) {
    return SlotRepository.getSOSAlerts(city);
  }

  static claimSOS(sosId: string, vendorId: string, vendorName: string) {
    return SlotRepository.claimSOS(sosId, vendorId, vendorName);
  }

  static dispatchSOS(sosId: string, replacementVendorId: string, surgeBonus: number, reason: string) {
    return SlotRepository.dispatchSOSBackup(sosId, replacementVendorId, surgeBonus, reason);
  }

  // Admin Master Dynamic Analytics Engine
  static getPlatformAnalytics() {
    return SlotRepository.getPlatformAnalytics();
  }

  // Annadanam Surplus Food Logistics
  static getFoodDonations() {
    return SlotRepository.getFoodDonations();
  }

  static dispatchFoodPickup(id: string, ngo: string, driverName?: string, driverPhone?: string) {
    return SlotRepository.dispatchFoodPickup(id, ngo, driverName, driverPhone);
  }

  static updateFoodPickupStatus(id: string, status: string, temperature?: number) {
    return SlotRepository.updateFoodPickupStatus(id, status, temperature);
  }

  // Anti-Circumvention Chat Audit Logs
  static getChatViolations() {
    return SlotRepository.getChatViolations();
  }

  static executeChatAction(id: string, action: 'warn' | 'fine' | 'suspend', notes?: string) {
    return SlotRepository.executeChatAction(id, action, notes);
  }

  // Double-Entry Nodal Escrow Ledger
  static getEscrowLedger() {
    return SlotRepository.getEscrowLedger();
  }

  // Admin Master Slot Override
  static adminOverrideSlot(venueId: string, eventDate: string, slotType: SlotType, action: 'force_lock' | 'force_release', reason?: string) {
    return SlotRepository.adminOverrideSlot(venueId, eventDate, slotType, action, reason);
  }
}

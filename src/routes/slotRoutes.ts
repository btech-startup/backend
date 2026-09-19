import { Router } from 'express';
import { SlotController } from '../controllers/slotController';

const router = Router();

// Venues & BookMyShow Slot Grid
router.get('/venues', SlotController.getVenues);
router.get('/venues/:id', SlotController.getVenueById);
router.get('/venues/:id/slots', SlotController.getVenueSlots);

// Modular Services (Catering, Photo, Decor, Purohit, Manager)
router.get('/services', SlotController.getModularServices);

// Slot Reservation & Multi-Vendor Checkout
router.post('/reserve', SlotController.reserveSlot);
router.post('/checkout-multi-vendor', SlotController.checkoutMultiVendor);

// Vendor Calendar & Slot Management
router.get('/vendor/calendar', SlotController.getVendorCalendar);
router.get('/vendor/:vendorId/calendar', SlotController.getVendorCalendar);
router.post('/vendor/toggle-block', SlotController.toggleVendorSlot);

// Admin Master Slot Radar
router.get('/admin/radar', SlotController.getAdminSlotRadar);

// Vendor Self-Service Onboarding Wizard
router.post('/vendor/onboard-venue', SlotController.onboardVenue);

// Admin KYC Desk
router.get('/admin/kyc-applications', SlotController.getKYCApplications);
router.post('/admin/kyc-applications/:id/review', SlotController.reviewKYCApplication);

// Dispute Tribunal
router.get('/disputes', SlotController.getDisputes);
router.post('/disputes', SlotController.createDispute);
router.post('/disputes/:id/resolve', SlotController.resolveDispute);

// Emergency SOS Broadcast & Dispatch
router.get('/sos/alerts', SlotController.getSOSAlerts);
router.post('/sos/trigger', SlotController.triggerSOS);
router.post('/sos/:id/claim', SlotController.claimSOS);
router.post('/sos/:id/dispatch', SlotController.dispatchSOS);

// Admin Master Dynamic Analytics Engine
router.get('/admin/analytics', SlotController.getPlatformAnalytics);

// Admin Master Slot Override (Force-Lock / Force-Release)
router.post('/admin/override-slot', SlotController.overrideSlot);

// Annadanam Surplus Food Rescue Logistics
router.get('/annadanam/pickups', SlotController.getFoodDonations);
router.post('/annadanam/dispatch', SlotController.dispatchFoodPickup);
router.post('/annadanam/:id/status', SlotController.updateFoodPickupStatus);

// Anti-Circumvention Chat Audit Log & Sanctions
router.get('/chat/violations', SlotController.getChatViolations);
router.post('/chat/violations/:id/action', SlotController.executeChatAction);

// Double-Entry Nodal Escrow Ledger
router.get('/admin/escrow-ledger', SlotController.getEscrowLedger);

export default router;


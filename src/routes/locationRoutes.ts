import { Router } from 'express';
import { LocationController } from '../controllers/locationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/track', authenticate, LocationController.updateLocation);
router.get('/vendor/:vendorId', authenticate, LocationController.getVendorLocation);
router.get('/nearby', authenticate, LocationController.getNearbyVendors);
router.get('/checkin/booking/:bookingId', authenticate, LocationController.getCheckinStatus);
router.get('/checkin/history', authenticate, LocationController.getCheckinHistory);

export default router;

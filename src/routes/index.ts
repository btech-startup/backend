import { Router } from 'express';
import authRoutes from './auth.routes';
import kycRoutes from './kyc.routes';
import vendorRoutes from './vendor.routes';
import priceCardRoutes from './priceCard.routes';
import userRoutes from './user.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Event Management Vendor & User Experience Backend',
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/vendor/kyc', kycRoutes);
router.use('/vendor/price-card', priceCardRoutes);
router.use('/vendor', vendorRoutes);
router.use('/user', userRoutes);

export default router;

import { Router } from 'express';
import authRoutes from './authRoutes.js';
import customerRoutes from './customerRoutes.js';
import vendorRoutes from './vendorRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import negotiationRoutes from './negotiationRoutes.js';
import checkinRoutes from './checkinRoutes.js';
import chatRoutes from './chatRoutes.js';
import adminRoutes from './adminRoutes.js';
import foodDonationRoutes from './foodDonationRoutes.js';
import muhurthamRoutes from './muhurthamRoutes.js';
import familyContributionRoutes from './familyContributionRoutes.js';
import { sendSuccess } from '../utils/apiResponse.js';

const apiRouter = Router();

// Master Health Check endpoint for Customer, Vendor, and Admin clients
apiRouter.get('/health', (req, res) => {
  sendSuccess(res, 'EventWise v2.0 API Gateway is healthy', {
    status: 'UP',
    database: 'PostgreSQL 16',
    edition: 'Full Indian Middle-Class Edition v2.0.0-PROD-SPEC',
    supportedActors: ['customer_app', 'vendor_app', 'admin_portal'],
    features: ['reverse_budget_splitter_v2', 'split_family_upi_pool', 'annadanam_food_donation', 'panchangam_muhurtham_radar'],
    timestamp: new Date(),
    version: '2.0.0-PROD-SPEC',
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/customer', customerRoutes);
apiRouter.use('/vendor', vendorRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/negotiations', negotiationRoutes);
apiRouter.use('/events/checkin', checkinRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/annadanam', foodDonationRoutes);
apiRouter.use('/muhurtham', muhurthamRoutes);
apiRouter.use('/family-pool', familyContributionRoutes);

export default apiRouter;

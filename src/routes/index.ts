import { Router } from 'express';
import authRoutes from './authRoutes';
import customerRoutes from './customerRoutes';
import vendorRoutes from './vendorRoutes';
import bookingRoutes from './bookingRoutes';
import negotiationRoutes from './negotiationRoutes';
import checkinRoutes from './checkinRoutes';
import chatRoutes from './chatRoutes';
import adminRoutes from './adminRoutes';
import foodDonationRoutes from './foodDonationRoutes';
import muhurthamRoutes from './muhurthamRoutes';
import familyContributionRoutes from './familyContributionRoutes';
import walletRoutes from './walletRoutes';
import deliverableRoutes from './deliverableRoutes';
import notificationRoutes from './notificationRoutes';
import locationRoutes from './locationRoutes';
import integrationRoutes from './integrationRoutes';
import { sendSuccess } from '../utils/apiResponse';

const apiRouter = Router();

// Master Health Check endpoint for Customer, Vendor, and Admin clients
apiRouter.get('/health', (req, res) => {
  sendSuccess(res, 'EventWise v3.0 API Gateway is healthy', {
    status: 'UP',
    database: 'PostgreSQL 16',
    edition: 'Full Indian Middle-Class Edition v3.0.0-PROD-SPEC',
    supportedActors: ['customer_app', 'vendor_app', 'admin_portal'],
    features: [
      'reverse_budget_splitter_v2',
      'split_family_upi_pool',
      'annadanam_food_donation',
      'panchangam_muhurtham_radar',
      'wallet_system',
      'deliverables_tracking',
      'notification_engine',
      'location_tracking',
      'payment_integration',
    ],
    timestamp: new Date(),
    version: '3.0.0-PROD-SPEC',
  });
});

// Core Routes
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

// v3.0 New Feature Routes
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/deliverables', deliverableRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/location', locationRoutes);
apiRouter.use('/integrations', integrationRoutes);

export default apiRouter;


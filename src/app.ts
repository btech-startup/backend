import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { swaggerSpec } from './docs/swagger';
import { securityHeaders, sanitizeRequestBody } from './middlewares/security.middleware';
import { env } from './config/env';

const app: Application = express();

// Security HTTP Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
app.use(securityHeaders);

// CORS Policy configuration
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-deal-token'],
  })
);

// Payload size limits to mitigate Denial of Service (DoS) memory exhaustion
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Input sanitization against Stored XSS
app.use(sanitizeRequestBody);

// Swagger Documentation Route (Restricted in production for security reconnaissance prevention)
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  app.use('/api-docs', (req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'API documentation is disabled in production.' });
  });
}

// Base Landing Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Event Management Vendor Backend API',
    version: '1.0.0',
    documentation: env.NODE_ENV !== 'production' ? '/api-docs' : 'Disabled in production',
    healthCheck: '/api/v1/health',
    endpoints: {
      auth: '/api/v1/auth',
      kyc: '/api/v1/vendor/kyc',
      profile: '/api/v1/vendor/profile',
      priceCards: '/api/v1/vendor/price-card',
      userVendors: '/api/v1/user/vendors',
      userBanking: '/api/v1/user/vendors/:id/banking',
      userCalendar: '/api/v1/user/vendors/:vendorId/calendar',
      verifyDate: '/api/v1/user/vendors/:vendorId/calendar/verify-date',
      vendorCalendar: '/api/v1/vendor/calendar',
      chatbotDeals: '/api/v1/user/deals/chatbot',
      sampleVendors: env.NODE_ENV !== 'production' ? '/api/v1/user/sample-vendors' : undefined,
    },
  });
});

// Mount Main API Routes
app.use('/api/v1', apiRoutes);

// 404 Handler for Unknown Routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { swaggerSpec } from './docs/swagger';

const app: Application = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base Landing Route
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Event Management Vendor Backend API',
    version: '1.0.0',
    documentation: '/api-docs',
    healthCheck: '/api/v1/health',
    endpoints: {
      auth: '/api/v1/auth',
      kyc: '/api/v1/vendor/kyc',
      profile: '/api/v1/vendor/profile',
      priceCards: '/api/v1/vendor/price-card',
      userVendors: '/api/v1/user/vendors',
      userBanking: '/api/v1/user/vendors/:id/banking',
      chatbotDeals: '/api/v1/user/deals/chatbot',
      sampleVendors: '/api/v1/user/sample-vendors',
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

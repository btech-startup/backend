import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger';
import { env } from './config/env';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';


const app: Application = express();

// Security HTTP headers with Swagger UI compatibility
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration for Web and Mobile clients
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP request logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Interactive API Documentation UI
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'EventWise REST API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1a1e24; }',
  })
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Raw OpenAPI JSON endpoint
app.get(['/docs.json', '/api-docs.json'], (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

// Root redirect to Swagger Documentation
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Global rate limiting middleware
app.use(rateLimiter(150, 15 * 60 * 1000));

// Mount main API v1 router
app.use('/api/v1', apiRouter);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;

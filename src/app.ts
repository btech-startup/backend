import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app: Application = express();

// Security HTTP headers
app.use(helmet());

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

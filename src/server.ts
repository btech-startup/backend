import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';

const startServer = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    logger.info(`📍 API base URL: http://localhost:${env.PORT}/api/v1`);
    logger.info(`💓 Health check: http://localhost:${env.PORT}/api/v1/health`);
  });

  const handleShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
});

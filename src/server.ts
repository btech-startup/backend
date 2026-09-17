import app from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const startServer = async () => {
  try {
    // Verify Database Connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully.');

    // Auto-seed sample vendors if database is fresh
    const vendorCount = await prisma.vendor.count();
    if (vendorCount < 2) {
      console.log('ℹ️ Fresh database detected. Auto-seeding rich sample vendors...');
      const { seedDatabase } = await import('./lib/seedData');
      await seedDatabase();
    }

    app.listen(env.PORT, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 Event Management Vendor Backend Server is Running!`);
      console.log(`📡 URL: http://localhost:${env.PORT}`);
      console.log(`📚 Interactive Swagger API Docs: http://localhost:${env.PORT}/api-docs`);
      console.log(`🩺 Health check: http://localhost:${env.PORT}/api/v1/health`);
      console.log(`👥 Sample Vendors Endpoint: http://localhost:${env.PORT}/api/v1/user/sample-vendors`);
      console.log(`🤖 Chatbot Deals Endpoint: http://localhost:${env.PORT}/api/v1/user/deals/chatbot`);
      console.log(`======================================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

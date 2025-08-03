import dotenv from 'dotenv';
import { createServer } from 'http';
import app from './app.js';
import {
  establishConnection,
  shutdown,
  startHeartbeat
} from './utils/database.js';
import logger from './utils/logger.js';
import { errorHandler } from './utils/errors.js';
import k8sService from './services/k8s.service.js'; // ✅ Import K8s service

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = createServer(app);

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// ✅ Global error handler (last middleware)
app.use(errorHandler);

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    server.close(async (err) => {
      if (err) throw err;
      await shutdown();
      logger.info('✅ Server shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('⚠️ Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  } catch (error) {
    logger.error('Shutdown error:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  try {
    // Connect to DB
    await establishConnection();
    startHeartbeat();
    logger.info('🫀 Database heartbeat monitor started');

    //  ✅ Check Kubernetes cluster connection
    await k8sService.verifyClusterConnection();

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.debug(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle process signals
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled rejection:', err);
      gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err);
      gracefulShutdown('uncaughtException');
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Server startup failed:', error);
    await shutdown();
    process.exit(1);
  }
};

startServer();

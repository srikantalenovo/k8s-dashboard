import app from './app.js';
import { establishConnection, shutdown, checkConnectionHealth } from './utils/database.js';
import { createServer } from 'http';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;
const server = createServer(app);

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close HTTP server
    server.close(async (err) => {
      if (err) {
        logger.error('Error closing HTTP server:', err);
        process.exit(1);
      }

      // Close database connection
      await shutdown();
      logger.info('Server and database connections closed gracefully');
      process.exit(0);
    });

    // Force shutdown if taking too long
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000); // 10 seconds timeout

  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Initialize server
const startServer = async () => {
  try {
    // Establish database connection
    await establishConnection();
    
    // Verify initial health check
    const isHealthy = await checkConnectionHealth();
    if (!isHealthy) {
      throw new Error('Initial database health check failed');
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err);
      gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    await shutdown();
    process.exit(1);
  }
};

// Start the application
startServer();

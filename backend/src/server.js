import app from './app.js';
import { sequelize, establishConnection, shutdown } from './utils/database.js';
import { createServer } from 'http';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;
const server = createServer(app);

/**
 * Performs a health check on the database connection
 */
const checkConnectionHealth = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database health check passed');
    return true;
  } catch (error) {
    logger.error('❌ Database health check failed:', error);
    return false;
  }
};

/**
 * Handles graceful shutdown of the application
 */
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
    }, 10000);

  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

/**
 * Initializes and starts the server
 */
const startServer = async () => {
  try {
    // 1. Establish database connection
    const isConnected = await establishConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }

    // 2. Verify initial health check
    const isHealthy = await checkConnectionHealth();
    if (!isHealthy) {
      throw new Error('Initial database health check failed');
    }

    // 3. Sync database models
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    logger.info('✅ Database models synchronized');

    // 4. Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // 5. Setup process handlers
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err);
      gracefulShutdown('unhandledRejection');
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

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
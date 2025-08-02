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
    // Initialize database
    await establishConnection();
    const heartbeat = startHeartbeat();
    
    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // Cleanup on exit
    const cleanup = async () => {
      clearInterval(heartbeat);
      await shutdown();
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
};

// Start the application
startServer();
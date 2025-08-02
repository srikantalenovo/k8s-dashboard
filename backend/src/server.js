import app from './app.js';
import { createServer } from 'http';
import { 
  sequelize, 
  establishConnection, 
  shutdown, 
  startHeartbeat 
} from './utils/database.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;
const server = createServer(app);

const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  try {
    // Close HTTP server
    server.close(async (err) => {
      if (err) throw err;
      
      // Close database connections
      await shutdown();
      logger.info('✅ Server shutdown complete');
      process.exit(0);
    });

    // Force shutdown after timeout
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
    // 1. Initialize database connection
    await establishConnection();
    
    // 2. Start heartbeat monitoring
    startHeartbeat();
    logger.info('🫀 Database heartbeat monitor started');

    // 3. Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.debug(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Process handlers
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

// Start the application
startServer();
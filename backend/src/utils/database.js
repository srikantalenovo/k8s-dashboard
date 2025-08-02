import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { setTimeout as sleep } from 'timers/promises';
import logger from './logger.js';

dotenv.config();

// Database configuration with enhanced error handling
const sequelize = new Sequelize(
  process.env.DB_NAME || 'grepmind',
  process.env.DB_USER || 'admin',
  process.env.DB_PASSWORD || 'admin123',
  {
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 5,
      match: [
        'SequelizeConnectionError',
        'SequelizeConnectionRefusedError',
        'SequelizeHostNotFoundError',
        'SequelizeHostNotReachableError',
        'SequelizeInvalidConnectionError',
        'ETIMEDOUT',
        'ECONNRESET',
        'ECONNREFUSED'
      ],
      backoffBase: 1000,
      backoffExponent: 1.5
    }
  }
);

// Connection lifecycle hooks
sequelize.addHook('afterConnect', (connection) => {
  logger.info('✅ New database connection established');
  connection.query('SET TIME ZONE UTC'); // Ensure consistent timezone
});

sequelize.addHook('afterDisconnect', () => {
  logger.warn('⚠️ Database connection lost');
});

// Test database connection with retry logic
const testConnection = async (maxRetries = 3, delayMs = 1000) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      await sequelize.authenticate();
      logger.info('✅ Database connection established');
      return true;
    } catch (error) {
      attempt++;
      logger.warn(`Connection attempt ${attempt}/${maxRetries} failed`);
      
      if (attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(2, attempt - 1);
        logger.info(`Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        logger.error('❌ Maximum connection attempts reached');
        throw error;
      }
    }
  }
};

// Graceful shutdown handler
const gracefulShutdown = async () => {
  try {
    await sequelize.close();
    logger.info('✅ Database connection closed gracefully');
    return true;
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
    return false;
  }
};

// Health check function
const checkHealth = async () => {
  try {
    await sequelize.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Model synchronization with safe defaults
const syncModels = async () => {
  try {
    const options = {
      alter: process.env.NODE_ENV === 'development',
      force: false,
      logging: logger.debug
    };
    
    await sequelize.sync(options);
    logger.info('✅ Database models synchronized');
    return true;
  } catch (error) {
    logger.error('❌ Model synchronization failed:', error);
    return false;
  }
};

export {
  sequelize,
  testConnection as establishConnection,
  gracefulShutdown as shutdown,
  checkHealth,
  syncModels
};
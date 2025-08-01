import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { setTimeout as sleep } from 'timers/promises';

dotenv.config();

// Database configuration with connection pooling
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ESOCKETTIMEDOUT/,
        /EHOSTDOWN/,
        /EPIPE/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 5 // Maximum retry attempts
    }
  }
);

export const query = async (text, params) => {
  try {
    const result = await sequelize.query(text, { bind: params });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Connection health check
const checkConnectionHealth = async () => {
  try {
    await sequelize.query('SELECT 1+1 AS result');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Enhanced connection test with exponential backoff
const establishConnection = async (maxRetries = 5, initialDelay = 1000) => {
  let retryCount = 0;
  let currentDelay = initialDelay;

  while (retryCount < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log('✅ PostgreSQL Connection Established');
      
      // Safe schema synchronization (alter: true for development only)
      const syncOptions = process.env.NODE_ENV === 'production' 
        ? { alter: false } 
        : { alter: true };
      
      await sequelize.sync(syncOptions);
      console.log('✅ Models Synced with Database');
      
      // Start periodic health checks
      startHealthMonitoring();
      return true;
    } catch (error) {
      retryCount++;
      console.error(`❌ Connection Attempt ${retryCount}/${maxRetries}:`, error.message);
      
      if (retryCount < maxRetries) {
        const jitter = Math.random() * 1000; // Add random jitter
        await sleep(currentDelay + jitter);
        currentDelay *= 2; // Exponential backoff
      } else {
        console.error('❌ Database Connection Failed after maximum retries');
        throw new Error('Unable to establish database connection');
      }
    }
  }
};

// Periodic health monitoring
let healthCheckInterval;
const startHealthMonitoring = () => {
  const interval = parseInt(process.env.DB_HEALTH_CHECK_INTERVAL || '30000', 10);
  
  healthCheckInterval = setInterval(async () => {
    const isHealthy = await checkConnectionHealth();
    if (!isHealthy) {
      console.error('Database connection lost. Attempting to reconnect...');
      clearInterval(healthCheckInterval);
      await establishConnection();
    }
  }, interval);
};

// Graceful shutdown handler
const shutdown = async () => {
  try {
    clearInterval(healthCheckInterval);
    await sequelize.close();
    console.log('Database connection gracefully closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export {
  sequelize,
  establishConnection,
  checkConnectionHealth,
  shutdown
};

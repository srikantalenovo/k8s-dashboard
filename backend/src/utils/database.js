import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from './logger.js';

// Configure dotenv with debug and override protection
dotenv.config({
  debug: process.env.NODE_ENV === 'development',
  override: false
});

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'grepmind',
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 5432,
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    connectTimeout: 30000
  },
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
    evict: 10000
  },
  retry: {
    max: 5,
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/
    ]
  }
});

// Connection lifecycle management
let connectionActive = false;

sequelize.addHook('afterConnect', () => {
  connectionActive = true;
  logger.info('✅ Database connection established');
});

sequelize.addHook('afterDisconnect', () => {
  connectionActive = false;
  logger.warn('⚠️ Database connection lost');
});

// Health check with connection state tracking
const checkConnection = async () => {
  try {
    if (!connectionActive) {
      await sequelize.authenticate();
    }
    await sequelize.query('SELECT 1');
    return true;
  } catch (error) {
    connectionActive = false;
    logger.error('❌ Database health check failed:', error);
    return false;
  }
};

// Enhanced connection manager
const establishConnection = async (maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await sequelize.authenticate();
      await sequelize.sync({
        alter: process.env.NODE_ENV === 'development',
        force: false
      });
      return true;
    } catch (error) {
      logger.warn(`Connection attempt ${attempt}/${maxAttempts} failed`);
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

// Graceful shutdown
const shutdown = async () => {
  try {
    await sequelize.close();
    logger.info('✅ Database connection closed gracefully');
    return true;
  } catch (error) {
    logger.error('❌ Error closing connection:', error);
    return false;
  }
};

// Heartbeat monitor
const startHeartbeat = (interval = 30000) => {
  const check = async () => {
    if (!await checkConnection()) {
      logger.warn('Attempting to reconnect...');
      await establishConnection(1);
    }
  };
  setInterval(check, interval);
  return check;
};

export {
  sequelize,
  establishConnection,
  shutdown,
  checkConnection,
  startHeartbeat
};
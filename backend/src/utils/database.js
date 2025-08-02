import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from './logger.js';

// ✅ Preload models so Sequelize registers them before sync
import '../models/user.model.js';

// Configure dotenv
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
    ssl: process.env.DB_SSL === 'true'
      ? { require: true, rejectUnauthorized: false }
      : false,
    connectTimeout: 30000,
    keepAlive: true
  },
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
    evict: 15000
  },
  retry: {
    max: 5,
    match: [
      /SequelizeConnectionError/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ETIMEDOUT/
    ],
    backoffBase: 1000,
    backoffExponent: 1.5
  }
});

let connectionActive = false;
let heartbeatInterval;

sequelize.addHook('afterConnect', () => {
  connectionActive = true;
  logger.info('✅ Database connection established');
});

sequelize.addHook('afterDisconnect', () => {
  connectionActive = false;
  logger.warn('⚠️ Database connection lost');
});

const establishConnection = async (maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await sequelize.authenticate();

      // ✅ Ensure lowercase users table exists
      const [results] = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='users';"
      );
      if (results.length === 0) {
        logger.warn('⚠️ users table not found — Sequelize will create it...');
      }

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

const checkConnection = async () => {
  try {
    await sequelize.query('SELECT 1');
    return true;
  } catch (error) {
    connectionActive = false;
    logger.error('Connection check failed:', error);
    return false;
  }
};

const shutdown = async () => {
  try {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    await sequelize.close();
    logger.info('✅ Database connection closed gracefully');
    return true;
  } catch (error) {
    logger.error('Shutdown error:', error);
    return false;
  }
};

const startHeartbeat = (interval = 30000) => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  const monitor = async () => {
    if (!await checkConnection()) {
      logger.warn('Attempting to reconnect...');
      try {
        await establishConnection(1);
      } catch (error) {
        logger.error('Reconnection failed:', error);
      }
    }
  };

  heartbeatInterval = setInterval(monitor, interval);
  return heartbeatInterval;
};

export {
  sequelize,
  establishConnection,
  shutdown,
  checkConnection,
  startHeartbeat
};

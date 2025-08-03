import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from './logger.js';
import bcrypt from 'bcrypt';

// ✅ Preload models so Sequelize registers them before sync
import '../models/user.model.js';
import User from '../models/user.model.js';

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

// 🔹 Auto Migration Script
const runMigrations = async () => {
  logger.info('🔄 Running automatic DB migrations...');
  
  // 1️⃣ Add `permissions` column if missing
  await sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'permissions'
      ) THEN
        ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '[]';
        RAISE NOTICE '✅ Added permissions column to users table';
      END IF;
    END$$;
  `);

  // 2️⃣ Ensure `role` enum exists & correct
  await sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'enum_users_role'
      ) THEN
        CREATE TYPE "enum_users_role" AS ENUM ('admin', 'editor', 'viewer');
      END IF;

      ALTER TABLE "users"
      ALTER COLUMN "role" DROP DEFAULT,
      ALTER COLUMN "role" TYPE "enum_users_role"
      USING ("role"::text::"enum_users_role"),
      ALTER COLUMN "role" SET DEFAULT 'viewer';
    END$$;
  `);

  logger.info('✅ DB migrations completed successfully');
};

// 🔹 Seed default admin user if not exists
const seedDefaultAdmin = async () => {
  const defaultAdminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existingAdmin = await User.findOne({ where: { email: defaultAdminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
    await User.create({
      username: 'admin',
      email: defaultAdminEmail,
      password: hashedPassword,
      role: 'admin',
      permissions: [{ resource: '*', actions: ['*'] }]
    });
    logger.info(`✅ Default admin user created: ${defaultAdminEmail} / ${defaultAdminPassword}`);
  } else {
    logger.info('ℹ️ Default admin user already exists');
  }
};

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

      // 🔹 Run migrations before sync
      await runMigrations();

      await sequelize.sync({
        alter: process.env.NODE_ENV === 'development',
        force: false
      });
      logger.info('✅ Sequelize models synced');

      // 🔹 Seed default admin after sync
      await seedDefaultAdmin();

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

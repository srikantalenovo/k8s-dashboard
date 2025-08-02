import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { setTimeout as sleep } from 'timers/promises';

dotenv.config();

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
        /SequelizeConnectionError/
      ],
      max: 5
    }
  }
);

// Connection hooks
sequelize.addHook('afterConnect', () => {
  console.log('✅ New database connection established');
});

sequelize.addHook('afterDisconnect', () => {
  console.warn('⚠️ Database connection lost');
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connection Established');
    
    // Sync models
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });
    console.log('✅ Models Synced with Database');
    return true;
  } catch (error) {
    console.error('❌ Database Connection Failed:', error.message);
    throw error;
  }
};

export { sequelize, testConnection };
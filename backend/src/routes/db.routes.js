import express from 'express';
import { authorize } from '../middleware/rbac.js';
import { sequelize } from '../utils/database.js';
import User from '../models/user.model.js';

const router = express.Router();

// Database health check — Admin only
router.get('/health', authorize(['admin']), async (req, res) => {
  try {
    const [queryResult] = await sequelize.query('SELECT 1+1 AS result');
    const userCount = await User.count();

    res.json({
      status: 'healthy',
      database: {
        connection: true,
        testQuery: queryResult[0].result === 2,
        users: userCount,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;

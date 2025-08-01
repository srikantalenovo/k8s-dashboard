import express from 'express';
import { sequelize } from '../utils/database.js';
import { User } from '../models/user.model.js';  // Fixed import

const router = express.Router();

// Database health check endpoint
router.get('/health', async (req, res) => {
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

// User verification endpoint
router.get('/verify-user', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email parameter required' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    res.json({
      exists: !!user,
      user: user ? {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

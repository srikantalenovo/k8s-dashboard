import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbac.js';
import { getAdminDashboard } from '../controllers/admin.controller.js';

const router = express.Router();

// Protected admin route with RBAC
router.get('/dashboard',
  authenticate,       // First verify JWT
  checkPermission('admin', 'access'),  // Then check permissions
  getAdminDashboard   // Finally execute controller
);

export default router;
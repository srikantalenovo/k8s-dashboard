import express from 'express';
import {
  getAdminDashboard,
  deleteUser,
  updateUserRole,
  updateUserAccess // ✅ Added only once
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ✅ Admin dashboard
router.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  getAdminDashboard
);

// ✅ Update user role
router.put(
  '/users/:id/role',
  authenticate,
  authorize('admin'),
  updateUserRole
);

// ✅ Update user access/permissions
router.put(
  '/users/:id/access',
  authenticate,
  authorize('admin'),
  updateUserAccess // ✅ No duplicate imports
);

// ✅ Delete user
router.delete(
  '/users/:id',
  authenticate,
  authorize('admin'),
  deleteUser
);

export default router;

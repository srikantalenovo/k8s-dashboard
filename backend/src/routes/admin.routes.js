import express from 'express';
import {
  getAdminDashboard,
  deleteUser,
  updateUserRole,
  updateUserAccess, // ✅ Added only once
  getAllUsers // ✅ Added for RBAC UI list
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// ✅ Admin  
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

// ✅ New route for Dashboard.js RBAC User List
router.get('/users', authenticate, authorize('admin'), getAllUsers);


export default router;

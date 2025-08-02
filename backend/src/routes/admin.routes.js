import express from 'express';
import { getAllUsers, updateUserAccess } from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';


const router = express.Router();

// Only admins can access these routes
router.use(authenticateToken, authorizeRoles('admin'));

// GET all users
router.get('/users', getAllUsers);

// Update user role & permissions
router.put('/users/:id/access', updateUserAccess);

// 🔹 NEW: Update user role & permissions
router.put(
  '/users/:id/access',
  authenticate,
  authorize('admin', 'access'),
  updateUserAccess
);

export default router;

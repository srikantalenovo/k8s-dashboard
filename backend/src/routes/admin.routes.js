import express from 'express';
import { 
  getAllUsers, 
  updateUserRole,
  getUserPermissions 
} from '../controllers/auth.controller.js';
import { validateToken } from '../middleware/validate.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(validateToken);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.get('/users/permissions', getUserPermissions);

export default router;

import express from 'express';
import { authorize } from '../middleware/rbac.js';
import {
  getAllUsers,
  updateUserRole,
  deleteUser
} from '../controllers/admin.controller.js';

const router = express.Router();

// Get all users — Admin only
router.get('/users', authorize(['admin']), getAllUsers);

// Update user role — Admin only
router.put('/users/:id/role', authorize(['admin']), updateUserRole);

// Delete user — Admin only
router.delete('/users/:id', authorize(['admin']), deleteUser);

export default router;

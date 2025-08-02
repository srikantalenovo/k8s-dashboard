// backend/src/controllers/admin.controller.js
import User from '../models/user.model.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

// Get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'permissions', 'isActive', 'createdAt']
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// Update user role & permissions
export const updateUserAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, permissions } = req.body;

    const allowedRoles = ['admin', 'editor', 'viewer'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.id === req.user.id && role !== 'admin') {
      return res.status(403).json({ error: 'You cannot change your own role' });
    }

    user.role = role;
    user.permissions = Array.isArray(permissions) ? permissions : [];
    await user.save();

    res.json({
      success: true,
      message: 'User access updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

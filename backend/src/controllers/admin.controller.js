import User from '../models/user.model.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Admin dashboard with stats
 */
export const getAdminDashboard = async (req, res) => {
  try {
    if (!req.user.hasPermission('admin', 'access')) {
      throw new ForbiddenError('Insufficient permissions');
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      data: {
        users,
        stats: {
          totalUsers: await User.count(),
          activeUsers: await User.count({ where: { isActive: true } }),
          adminCount: await User.count({ where: { role: 'admin' } })
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    throw error;
  }
};

/**
 * Get all users (with optional role filter)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const where = role ? { role } : {};

    const users = await User.findAll({
      where,
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'createdAt']
    });

    res.json({ success: true, users });
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};

/**
 * Update a user's role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      throw new BadRequestError('Invalid role specified');
    }

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.role = role;
    user.permissions = null; // Will be regenerated in model hook
    await user.save();

    res.json({ success: true, message: 'Role updated successfully', user });
  } catch (error) {
    console.error('Update user role error:', error);
    throw error;
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

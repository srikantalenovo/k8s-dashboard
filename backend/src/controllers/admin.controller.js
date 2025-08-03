import User from '../models/user.model.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * GET /admin/dashboard
 */
export const getAdminDashboard = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'permissions', 'createdAt'],
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
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /admin/users/:id/role
 */
export const updateUserRole = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      throw new BadRequestError('Invalid role specified');
    }

    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError('User not found');

    user.role = role;
    await user.save();

    res.json({ success: true, message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /admin/users/:id/access
 * ✅ Update user's permissions (RBAC)
 */
export const updateUserAccess = async (req, res) => {
  try {
    const { role, permissions } = req.body;

    // Only admin can update
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ Update both role & permissions
    if (role) {
      user.role = role;
    }
    if (permissions) {
      user.permissions = permissions;
    }

    await user.save();

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user access:', error);
    res.status(500).json({ error: 'Failed to update user access' });
  }
};


/**
 * DELETE /admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError('User not found');

    await user.destroy();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

// ✅ Add this new function
export const getAllUsers = async (req, res) => {
  try {
    // Only admins can access
    if (req.user.role !== 'admin') {
      throw new ForbiddenError('Insufficient permissions');
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'permissions', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
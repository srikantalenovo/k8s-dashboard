import  User  from '../models/user.model.js';
import { ForbiddenError } from '../utils/errors.js';

export const getAdminDashboard = async (req, res) => {
    try {
        // Verify admin permissions again (redundant check for security)
        if (!req.user.hasPermission('admin', 'access')) {
            throw new ForbiddenError('Insufficient permissions');
        }

        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'createdAt'],
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
        throw error; // Let the error handler deal with it
    }
};
import { User } from '../models/user.model.js';
import { ForbiddenError } from '../utils/errors.js';

export const getAdminDashboard = async (req, res) => {
    try {
        // Example admin-only operation
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role'],
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        res.json({
            success: true,
            data: {
                users,
                stats: {
                    totalUsers: users.length,
                    // Add other admin stats here
                }
            }
        });

    } catch (error) {
        throw new ForbiddenError('Admin dashboard access failed');
    }
};

// Add more admin controllers as needed
export const adminAction1 = async (req, res) => { /* ... */ };
export const adminAction2 = async (req, res) => { /* ... */ };
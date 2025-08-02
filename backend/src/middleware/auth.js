import jwt from 'jsonwebtoken';
import { ForbiddenError } from '../utils/errors.js';
import User from '../models/user.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new ForbiddenError('Authentication token required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'username', 'email', 'role', 'permissions']
    });

    if (!user) {
      throw new ForbiddenError('User not found');
    }

    // Attach full user object with permissions to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    next();
  } catch (error) {
    next(error);
  }
};
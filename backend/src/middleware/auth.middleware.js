import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

/**
 * 🔹 Middleware: Authenticate user using JWT
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    };

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(err.statusCode || 401).json({
      success: false,
      error: err.message || 'Unauthorized'
    });
  }
};

/**
 * 🔹 Middleware: Authorize user based on role or permission
 * @param {string} resource - Resource name
 * @param {string} action - Action name
 */
export const authorize = (resource, action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      // Admin always has full access
      if (req.user.role === 'admin') {
        return next();
      }

      const hasAccess = req.user.permissions.some(
        perm =>
          (perm.resource === resource || perm.resource === '*') &&
          (perm.actions.includes(action) || perm.actions.includes('*'))
      );

      if (!hasAccess) {
        throw new ForbiddenError('You do not have permission to perform this action');
      }

      next();
    } catch (err) {
      console.error('Authorization error:', err);
      res.status(err.statusCode || 403).json({
        success: false,
        error: err.message || 'Forbidden'
      });
    }
  };
};

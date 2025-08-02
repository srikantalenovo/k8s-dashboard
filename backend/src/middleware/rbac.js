import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Middleware factory to check RBAC
export const authorize = (allowedRoles = [], requiredPermission = null) => {
  return async (req, res, next) => {
    try {
      // 1. Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }
      const token = authHeader.split(' ')[1];

      // 2. Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Fetch user from DB
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: User not found' });
      }

      // 4. Role-based check
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient role' });
      }

      // 5. Permission-based check (if specified)
      if (requiredPermission) {
        const { resource, action } = requiredPermission;
        const hasPermission = user.hasPermission(resource, action);
        if (!hasPermission) {
          return res.status(403).json({ error: 'Forbidden: Missing required permission' });
        }
      }

      // 6. Attach user to request and continue
      req.user = user;
      next();

    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };
};

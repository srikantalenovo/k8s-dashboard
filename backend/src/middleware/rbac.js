export const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      // Get user from database (not just from JWT to ensure permissions are current)
      const user = await req.db.User.findByPk(req.user.userId);
      
      if (!user) {
        return res.status(403).json({ error: 'User not found' });
      }

      if (user.hasPermission(resource, action)) {
        return next();
      }

      res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const rbacMiddleware = (req, res, next) => {
  req.rbac = {
    can: (resource, action) => {
      if (req.user?.role === 'admin') return true;
      return req.user?.permissions?.some(perm => 
        (perm.resource === resource || perm.resource === '*') &&
        (perm.actions.includes(action) || perm.actions.includes('*'))
      );
    }
  };
  next();
};

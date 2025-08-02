export const authorize = (requiredRole, requiredAction) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    const hasPermission = req.user.permissions?.some(
      (perm) =>
        (perm.resource === requiredRole || perm.resource === '*') &&
        (perm.actions.includes(requiredAction) || perm.actions.includes('*'))
    );

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

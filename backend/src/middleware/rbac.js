import { ForbiddenError } from '../utils/errors.js';

export const checkPermission = (resource, action) => {
  return (req, res, next) => {
    // req.user should be set by your authenticate middleware
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }

    // Check if user has the required permission
    const hasAccess = req.user.permissions?.some(perm => 
      (perm.resource === resource || perm.resource === '*') &&
      (perm.actions.includes(action) || perm.actions.includes('*'))
    );

    if (!hasAccess) {
      throw new ForbiddenError(`Required permission: ${action} on ${resource}`);
    }

    next();
  };
};
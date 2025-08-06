// src/utils/permissions.js

/**
 * Check if a user has a specific permission.
 * @param {Object} user - The user object
 * @param {string} permission - The permission to check
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  return user?.permissions?.includes(permission);
};

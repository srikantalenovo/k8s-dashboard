// src/utils/permissions.js


// Permission presets
export const PERMISSION_OPTIONS = [
  { resource: 'pods', actions: ['read', 'delete'] },
  { resource: 'nodes', actions: ['read'] },
  { resource: 'deployments', actions: ['read', 'update'] },
  { resource: 'logs', actions: ['read'] },
  { resource: 'cluster', actions: ['read'] },
  { resource: '*', actions: ['*'] }
];

export const ROLE_PRESETS = {
  admin: [{ resource: '*', actions: ['*'] }],
  editor: [
    { resource: 'pods', actions: ['read', 'delete'] },
    { resource: 'deployments', actions: ['read', 'update'] },
    { resource: 'nodes', actions: ['read'] },
    { resource: 'logs', actions: ['read'] }
  ],
  viewer: [
    { resource: 'pods', actions: ['read'] },
    { resource: 'deployments', actions: ['read'] },
    { resource: 'nodes', actions: ['read'] },
    { resource: 'logs', actions: ['read'] }
  ]
};


export const hasPermission = (user, resource, action) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.permissions?.some(
    perm =>
      (perm.resource === resource || perm.resource === '*') &&
      (perm.actions.includes(action) || perm.actions.includes('*'))
  );
};

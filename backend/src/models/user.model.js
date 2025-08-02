import { DataTypes } from 'sequelize';
import { sequelize } from '../utils/database.js';
import bcrypt from 'bcrypt';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 255]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 255]
    }
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'viewer'),
    defaultValue: 'viewer'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      // Set default permissions based on role
      if (!user.permissions) {
        user.permissions = getDefaultPermissions(user.role);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      // Update permissions if role changed
      if (user.changed('role') && !user.changed('permissions')) {
        user.permissions = getDefaultPermissions(user.role);
      }
    }
  },
  timestamps: true,
  underscored: false
});

// Default permissions for each role
function getDefaultPermissions(role) {
  const defaults = {
    admin: [
      { resource: '*', actions: ['*'] }
    ],
    editor: [
      { resource: 'nodes', actions: ['read'] },
      { resource: 'pods', actions: ['read', 'create', 'delete'] },
      { resource: 'deployments', actions: ['read', 'create', 'update'] }
    ],
    viewer: [
      { resource: 'nodes', actions: ['read'] },
      { resource: 'pods', actions: ['read'] },
      { resource: 'deployments', actions: ['read'] }
    ]
  };
  return defaults[role] || [];
}

// Password comparison method
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has permission
User.prototype.hasPermission = function(resource, action) {
  if (this.role === 'admin') return true;
  
  return this.permissions.some(perm => {
    return (perm.resource === resource || perm.resource === '*') &&
           (perm.actions.includes(action) || perm.actions.includes('*'));
  });
};

// Create default admin user
User.createDefaultAdmin = async function() {
  const admin = await this.findOne({ where: { username: 'admin' } });
  if (!admin) {
    await this.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Admin@123', // In production, use environment variables
      role: 'admin'
    });
    console.log('Default admin user created');
  }
};

export default User;

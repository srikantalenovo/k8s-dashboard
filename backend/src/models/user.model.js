import { DataTypes } from 'sequelize';
import { sequelize } from '../utils/database.js';
import bcrypt from 'bcrypt';

// Define the model
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
  role: {
    type: DataTypes.ENUM('admin', 'editor', 'viewer'),
    defaultValue: 'viewer'
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      if (!user.permissions) {
        user.permissions = getDefaultPermissions(user.role);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      if (user.changed('role') && !user.changed('permissions')) {
        user.permissions = getDefaultPermissions(user.role);
      }
    }
  },
  timestamps: true
});

// Helper function
function getDefaultPermissions(role) {
  const permissions = {
    admin: [{ resource: '*', actions: ['*'] }],
    editor: [
      { resource: 'dashboard', actions: ['read', 'edit'] },
      { resource: 'content', actions: ['create', 'edit', 'delete'] }
    ],
    viewer: [
      { resource: 'dashboard', actions: ['read'] },
      { resource: 'content', actions: ['read'] }
    ]
  };
  return permissions[role] || [];
}

// Add methods
UserModel.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserModel.prototype.hasPermission = function(resource, action) {
  if (this.role === 'admin') return true;
  return this.permissions.some(perm => 
    (perm.resource === resource || perm.resource === '*') &&
    (perm.actions.includes(action) || perm.actions.includes('*'))
  );
};

// Initialize admin
UserModel.initAdmin = async () => {
  const [admin] = await UserModel.findOrCreate({
    where: { email: 'admin@example.com' },
    defaults: {
      username: 'admin',
      password: 'Admin@123',
      role: 'admin'
    }
  });
  return admin;
};

// Named export
export default User;
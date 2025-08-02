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
  // ✅ Keep STRING in Sequelize but validate as ENUM
  role: {
    type: DataTypes.STRING,
    defaultValue: 'viewer',
    validate: {
      isIn: [['admin', 'editor', 'viewer']]
    }
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',        // ✅ Matches init.sql lowercase table
  freezeTableName: true,
  timestamps: true,
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
  }
});

// Default permissions by role
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

// Compare password
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Permission check
User.prototype.hasPermission = function(resource, action) {
  if (this.role === 'admin') return true;
  return this.permissions.some(perm =>
    (perm.resource === resource || perm.resource === '*') &&
    (perm.actions.includes(action) || perm.actions.includes('*'))
  );
};

// Login helper
User.findByCredentials = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new Error('Invalid email or password');
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Invalid email or password');

  // ✅ Update last login on successful auth
  user.lastLogin = new Date();
  await user.save();

  return user;
};

export default User;

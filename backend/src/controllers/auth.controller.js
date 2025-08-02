import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// 🔹 Default RBAC permissions based on role
const getDefaultPermissions = (role) => {
  const permissionsMap = {
    admin: [{ resource: '*', actions: ['*'] }],
    editor: [
      { resource: 'dashboard', actions: ['read', 'edit'] },
      { resource: 'content', actions: ['create', 'edit', 'delete'] },
      { resource: 'nodes', actions: ['read'] },
      { resource: 'logs', actions: ['read'] }
    ],
    viewer: [
      { resource: 'dashboard', actions: ['read'] },
      { resource: 'nodes', actions: ['read'] }
    ]
  };
  return permissionsMap[role] || [];
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Ensure permissions are always present
    const userPermissions = Array.isArray(user.permissions) && user.permissions.length > 0
      ? user.permissions
      : getDefaultPermissions(user.role);

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        permissions: userPermissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: userPermissions
      },
      token
    });

  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const signup = async (req, res) => {
  try {
    const { username, email, password, role = 'viewer' } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Assign default permissions based on role
    const defaultPermissions = getDefaultPermissions(role);

    const user = await User.create({
      username,
      email,
      password,
      role,
      permissions: defaultPermissions
    });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        permissions: defaultPermissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: defaultPermissions
      },
      token
    });

  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

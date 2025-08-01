import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { sequelize } from '../utils/database.js';

// Helper function for default permissions
const getDefaultPermissions = (role) => {
  const defaults = {
    admin: [{ resource: '*', actions: ['*'] }],
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
};

export const signup = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start transaction
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(422).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      },
      transaction
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'User already exists',
        field: existingUser.email === email ? 'email' : 'username'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with transaction
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'viewer',
      permissions: getDefaultPermissions('viewer'),
      isActive: true,
      lastLogin: null
    }, { transaction });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await transaction.commit(); // Commit transaction

    console.log('User created successfully:', user.id); // Debug log

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: error.message // Include error message in response for debugging
    });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        field: 'email'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
        field: 'password'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: error.message
    });
  }
};

// Admin-only functions
export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'lastLogin', 'createdAt']
    });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to get users',
      details: error.message
    });
  }
};

export const updateUserRole = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    if (req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { userId } = req.params;
    const { role, permissions } = req.body;

    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await user.update({
      role,
      permissions: permissions || getDefaultPermissions(role)
    }, { transaction });

    await transaction.commit();

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions: updatedUser.permissions
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update user role error:', error);
    res.status(500).json({ 
      error: 'Failed to update user role',
      details: error.message
    });
  }
};

export const getUserPermissions = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'permissions']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user.id,
      permissions: user.permissions
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ 
      error: 'Failed to get permissions',
      details: error.message
    });
  }
};

// Test endpoint to verify database connection
export const testDbConnection = async (req, res) => {
  try {
    await sequelize.authenticate();
    const userCount = await User.count();
    res.json({
      status: 'Database connection successful',
      userCount
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      error: 'Database connection failed',
      details: error.message
    });
  }
};

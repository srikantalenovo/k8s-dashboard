import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { UnauthorizedError, ConflictError } from '../utils/errors.js';

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Ensure both fields are present
    if (!email || !password) {
      throw new UnauthorizedError('Email and password are required');
    }

    const user = await User.findByCredentials(email, password);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Signup user
 */
export const signup = async (req, res, next) => {
  try {
    const { username, email, password, role = 'viewer' } = req.body;

    if (!username || !email || !password) {
      throw new ConflictError('Username, email, and password are required');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const user = await User.create({
      username,
      email,
      password,
      role
    });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    next(error);
  }
};

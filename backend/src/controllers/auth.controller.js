import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    
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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { username, email, password, role = 'viewer' } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};
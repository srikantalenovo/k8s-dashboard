import express from 'express';
import { signup, login, verifyToken } from '../controllers/auth.controller.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected route
router.get('/verify', authenticate, verifyToken);

export default router;
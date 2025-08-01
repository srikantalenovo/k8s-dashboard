import express from 'express';
import { signup, login } from '../controllers/auth.controller.js';
import { signupRules, loginRules, validate } from '../middleware/validate.js';

const router = express.Router();

// Apply validation middleware to routes
router.post('/signup', 
  signupRules(),
  validate,
  signup
);

router.post('/login',
  loginRules(),
  validate,
  login
);

export default router;

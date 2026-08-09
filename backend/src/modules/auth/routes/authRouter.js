import express from 'express';
import { verifyToken } from '../../../middleware/verifyToken.js';
import { authLimiter } from '../../../middleware/rateLimiter.js';
import { validateRegister, validateLogin } from '../../../middleware/inputValidators.js';

import {
  addUser, loginUser, checkEmailAvailability, logoutUser, getCurrentUser
} from '../controllers/authController.js';

const router = express.Router();

// ============================
// REGISTER - Create new user account
// ============================

router.post('/register', authLimiter, validateRegister, addUser);

// ============================
// LOGIN - Authenticate user with email
// ============================

router.post('/login', authLimiter, validateLogin, loginUser);
router.post('/logout', logoutUser);
router.get('/me', verifyToken, getCurrentUser);

// ============================
// SEARCH BY EMAIL - Get user public data
// ============================

router.get('/check-email/:gmail', authLimiter, checkEmailAvailability);

export default router;

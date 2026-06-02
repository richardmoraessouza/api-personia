import express from 'express';
import { verifyToken } from '../../../middleware/verifyToken.js';
import { validateRegister, validateLogin } from '../../../middleware/inputValidators.js';

import {
  addUser, loginUser, searchByGmail
} from '../controllers/authController.js';

const router = express.Router();

// ============================
// REGISTER - Create new user account
// ============================
router.post('/register', validateRegister, addUser);

// ============================
// LOGIN - Authenticate user with email
// ============================
router.post('/login', validateLogin, loginUser);

// ============================
// SEARCH BY EMAIL - Get user public data
// ============================
router.get('/gmail/:gmail', searchByGmail);

export default router;
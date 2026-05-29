import express from 'express';
import { verifyToken } from '../../../middleware/verifyToken.js';

import {
  addUser, loginUser, searchByGmail
} from '../controllers/authController.js';

const router = express.Router();

// ============================
// REGISTER - Create new user account
// ============================
router.post('/register', addUser);

// ============================
// LOGIN - Authenticate user with email
// ============================
router.post('/login', loginUser);

// ============================
// SEARCH BY EMAIL - Get user public data
// ============================
router.get('/gmail/:gmail', searchByGmail);

export default router;
import express from 'express';
import { verifyToken } from '../../../middleware/verifyToken.js';

import {
  addUser, loginUser, searchByGmail
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', addUser);

router.post('/login', loginUser);

router.get('/gmail/:gmail', searchByGmail);

export default router;
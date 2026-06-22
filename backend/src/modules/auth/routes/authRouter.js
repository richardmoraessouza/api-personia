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
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Create a new user account
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             gmail: joao@gmail.com
 *             nome: João Silva
 *             imgPerfil: https://example.com/foto.jpg
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             example:
 *               id: 12
 *               gmail: joao@gmail.com
 *               nome: João Silva
 *               foto_perfil: https://example.com/foto.jpg
 *               descricao: null
 *               frame: null
 *       400:
 *         description: Invalid registration data
 *       500:
 *         description: Error registering user
 */
router.post('/register', validateRegister, addUser);

// ============================
// LOGIN - Authenticate user with email
// ============================
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user by email
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             gmail: joao@gmail.com
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             example:
 *               id: 12
 *               nome: João Silva
 *               gmail: joao@gmail.com
 *               foto_perfil: https://example.com/foto.jpg
 *               descricao: Apaixonado por anime e RPG
 *               frame: gold
 *       400:
 *         description: Invalid login data
 *       401:
 *         description: Incorrect email or password
 *       500:
 *         description: Error logging in user
 */
router.post('/login', validateLogin, loginUser);

// ============================
// SEARCH BY EMAIL - Get user public data
// ============================
/**
 * @swagger
 * /auth/gmail/{gmail}:
 *   get:
 *     summary: Get a user's public data by email
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: gmail
 *         required: true
 *         schema:
 *           type: string
 *         description: User's email address
 *     responses:
 *       200:
 *         description: Public user data found
 *         content:
 *           application/json:
 *             example:
 *               gmail: joao@gmail.com
 *               nome: João Silva
 *               foto_perfil: https://example.com/foto.jpg
 *               frame: gold
 *       404:
 *         description: User not found
 *       500:
 *         description: Error searching user
 */
router.get('/gmail/:gmail', searchByGmail);

export default router;
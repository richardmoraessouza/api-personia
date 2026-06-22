import { Router } from "express";
import { getUserById, getNameUser, getOtherUser, 
        editProfile, getNameOtherUser, getDataMiniProfile, updateFrame
       } from "../controllers/userController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";

const router = Router();

// ============================
// SEARCH USER - Find user by query
// ============================
// router.get("/searchUser",  getUsuario);

/**
 * @swagger
 * /users/user/{id}:
 *   get:
 *     summary: Get authenticated user data by ID
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             example:
 *               id: 12
 *               nome: João Silva
 *               foto_perfil: https://example.com/foto.jpg
 *               descricao: Apaixonado por anime e RPG
 *       401:
 *         description: Missing or invalid authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error while searching profile
 */
router.get("/user/:id", verifyToken, getUserById);

/**
 * @swagger
 * /users/name-user/{id}:
 *   get:
 *     summary: Get user name and basic profile data by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User name and profile data found
 *         content:
 *           application/json:
 *             example:
 *               nome: João Silva
 *               foto_perfil: https://example.com/foto.jpg
 *               descricao: Apaixonado por anime e RPG
 *               frame: gold
 *       400:
 *         description: Invalid ID
 *       500:
 *         description: Error searching user name
 */
router.get('/name-user/:id', getNameUser);

/**
 * @swagger
 * /users/other-user/{id}:
 *   get:
 *     summary: Get another user's public profile data
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public profile data found
 *         content:
 *           application/json:
 *             example:
 *               id: 12
 *               nome: João Silva
 *               foto_perfil: https://example.com/foto.jpg
 *               descricao: Apaixonado por anime e RPG
 *               frame: gold
 *       500:
 *         description: Internal server error
 */
router.get('/other-user/:id', getOtherUser);

/**
 * @swagger
 * /users/edit-profile/{usuarioId}:
 *   put:
 *     summary: Update user profile information
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nome: João Silva
 *             foto_perfil: https://example.com/nova-foto.jpg
 *             descricao: Nova descrição do perfil
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Perfil atualizado com sucesso!
 *               usuario_atualizado:
 *                 id: 12
 *                 nome: João Silva
 *                 foto_perfil: https://example.com/nova-foto.jpg
 *                 descricao: Nova descrição do perfil
 *       400:
 *         description: Name is required and cannot be empty
 *       401:
 *         description: Missing or invalid authentication token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal error while updating profile
 */
router.put('/edit-profile/:usuarioId', verifyToken, editProfile);

/**
 * @swagger
 * /users/name-other-user/{usuarioId}:
 *   get:
 *     summary: Get another user's name by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User name found
 *         content:
 *           application/json:
 *             example:
 *               nome: João Silva
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Error searching user name
 */
router.get(`/name-other-user/:usuarioId`, getNameOtherUser);

/**
 * @swagger
 * /users/mini-profile/{usuarioId}:
 *   get:
 *     summary: Get user data for mini profile preview
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Mini profile data found
 *         content:
 *           application/json:
 *             example:
 *               id: 12
 *               nome: João Silva
 *               foto_perfil: https://example.com/foto.jpg
 *               descricao: Apaixonado por anime e RPG
 *               frame: gold
 *               is_online: true
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get(`/mini-profile/:usuarioId`, getDataMiniProfile);

/**
 * @swagger
 * /users/update-frame/{usuarioId}:
 *   put:
 *     summary: Update the user's profile frame
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             frame: gold
 *     responses:
 *       200:
 *         description: Frame updated successfully
 *         content:
 *           application/json:
 *             example:
 *               frame: gold
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Missing or invalid authentication token
 *       500:
 *         description: Internal server error
 */
router.put(`/update-frame/:usuarioId`, verifyToken, updateFrame )

export default router;
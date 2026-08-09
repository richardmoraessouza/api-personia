/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Endpoints de autenticação, cadastro e identidade do usuário.
 */

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

/**
 * @swagger
 * /auth/check-email/{gmail}:
 *   get:
 *     summary: Check whether an email is already registered
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: path
 *         name: gmail
 *         required: true
 *         schema:
 *           type: string
 *         description: User email address to verify
 *     responses:
 *       200:
 *         description: Email availability checked successfully
 *         content:
 *           application/json:
 *             example:
 *               exists: true
 *               user:
 *                 gmail: joao@gmail.com
 *                 nome: João Silva
 *                 foto_perfil: https://example.com/foto.jpg
 *                 frame: gold
 *       500:
 *         description: Error checking email availability
 */

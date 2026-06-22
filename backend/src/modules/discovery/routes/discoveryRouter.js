import { Router } from 'express';
import { getPopularWeek, getFeed } from '../controllers/discoveryController.js';

const router = Router();

/**
 * @swagger
 * /discovery/popular-week:
 *   get:
 *     summary: Get the most popular characters created in the last 7 days
 *     tags:
 *       - Discovery
 *     responses:
 *       200:
 *         description: List of popular characters, ranked by a weighted score of views and favorites
 *         content:
 *           application/json:
 *             example:
 *               - id: 45
 *                 nome: Naruto
 *                 fotoia: https://example.com/naruto.jpg
 *                 tipo_personagem: anime
 *                 usuario_id: 12
 *                 bio: Ninja da Folha
 *                 descricao: Personagem principal de Naruto
 *                 visualizacoes: 1000
 *                 quantidade_favoritos: 32
 *                 score_popularidade: 1480
 *       500:
 *         description: Internal server error while loading popular characters
 */
router.get('/popular-week', getPopularWeek);

/**
 * @swagger
 * /discovery/recommendations/{usuarioId}:
 *   get:
 *     summary: Get personalized character recommendations for a user, based on tag interaction scores
 *     tags:
 *       - Discovery
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of recommended characters, ranked by tag affinity score
 *         content:
 *           application/json:
 *             example:
 *               - id: 78
 *                 nome: Sasuke
 *                 fotoia: https://example.com/sasuke.jpg
 *                 bio: Último sobrevivente do clã Uchiha
 *                 usuario_id: 12
 *                 visualizacoes: 540
 *                 score_total: 35
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Internal server error while fetching the feed
 */
router.get('/recommendations/:usuarioId', getFeed);

export default router;
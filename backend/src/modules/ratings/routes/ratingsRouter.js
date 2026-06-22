import { Router } from 'express';
import * as ratingsController from '../controllers/ratingsController.js';

const router = Router();

/**
 * @swagger
 * /ratings/tags:
 *   get:
 *     summary: Get all available categories and tags
 *     tags:
 *       - Ratings
 *     responses:
 *       200:
 *         description: List of available tags
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 nome: Anime
 *                 slug: anime
 *               - id: 2
 *                 nome: RPG
 *                 slug: rpg
 *       500:
 *         description: Internal server error
 */
router.get('/tags', ratingsController.getTags);

/**
 * @swagger
 * /ratings/characters/{slug}:
 *   get:
 *     summary: Get characters by category
 *     tags:
 *       - Ratings
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Category slug
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Characters found
 *         content:
 *           application/json:
 *             example:
 *               - id: 45
 *                 nome: Naruto
 *                 bio: Ninja da Folha
 *                 visualizacoes: 1000
 *                 tags_slugs:
 *                   - anime
 *       400:
 *         description: Invalid category slug
 *       500:
 *         description: Internal server error
 */
router.get('/characters/:slug', ratingsController.getCharactersByCategory);

/**
 * @swagger
 * /ratings/reclassify/{characterId}:
 *   post:
 *     summary: Reclassify a character using AI
 *     tags:
 *       - Ratings
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Character ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nome: Naruto
 *             bio: Ninja da Folha
 *             personalidade: Determinado
 *             historia: Futuro Hokage
 *     responses:
 *       200:
 *         description: Character successfully reclassified
 *         content:
 *           application/json:
 *             example:
 *               message: Character reclassified successfully!
 *               tags:
 *                 - anime
 *                 - shonen
 *       400:
 *         description: Character ID is required
 *       500:
 *         description: Error processing character classification
 */
router.post('/reclassify/:characterId', ratingsController.reclassifyCharacter);

export default router;
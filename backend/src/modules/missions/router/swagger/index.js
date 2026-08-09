/**
 * @openapi
 * tags:
 *   - name: Missions
 *     description: Endpoints relacionados a missões, progresso e engajamento do usuário.
 */

/**
 * @swagger
 * /missions/daily/{usuarioId}:
 *   get:
 *     summary: Get the daily mission list for a user
 *     tags:
 *       - Missions
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Daily missions returned successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /missions/progress:
 *   post:
 *     summary: Update mission progress for a user
 *     tags:
 *       - Missions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             usuarioId: 12
 *             missionId: 3
 *             incremento: 1
 *     responses:
 *       200:
 *         description: Mission progress updated successfully
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /missions/claim/{missionId}:
 *   post:
 *     summary: Claim a mission reward
 *     tags:
 *       - Missions
 *     parameters:
 *       - in: path
 *         name: missionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Mission claimed successfully
 *       500:
 *         description: Internal server error
 */

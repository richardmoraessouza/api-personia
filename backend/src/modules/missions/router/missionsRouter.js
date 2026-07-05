import { Router } from 'express';
import { getDailyMissions, claimMission } from '../controller/missionController.js';
import { verifyToken } from '../../../middleware/verifyToken.js';

const router = Router();

/**
 * @swagger
 * /missions/daily/{usuarioId}:
 * get:
 * summary: Busca ou gera as 5 missões aleatórias do dia para o usuário
 * tags:
 * - Missions
 */
router.get('/daily/:usuarioId', verifyToken, getDailyMissions);

// Claim a mission reward (server-side verification, no XP amount accepted from client)
router.post('/claim/:missionId', verifyToken, claimMission);

export default router;
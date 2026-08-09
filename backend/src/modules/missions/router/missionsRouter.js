import express from 'express';
import { getDailyMissions, updateMissionProgress, claimMission } from '../controller/missionController.js';

const router = express.Router();

// GET /missions/daily/:usuarioId
router.get('/daily/:usuarioId', getDailyMissions);

// POST /missions/progress
router.post('/progress', updateMissionProgress);

// POST /missions/claim/:missionId
router.post('/claim/:missionId', claimMission);

export default router;

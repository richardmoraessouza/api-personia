import { Router } from 'express';
import { getPopularWeek, getFeed } from '../controllers/discoveryController.js';

const router = Router();

router.get('/popular-week', getPopularWeek);

router.get('/recommendations/:usuarioId', getFeed);

export default router;
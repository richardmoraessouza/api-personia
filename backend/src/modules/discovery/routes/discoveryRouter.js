import { Router } from 'express';
import { getPopularWeek } from '../controllers/discoveryController.js';

const router = Router();

router.get('/popular-week', getPopularWeek);

export default router;
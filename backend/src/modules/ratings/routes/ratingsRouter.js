import { Router } from 'express';
import * as ratingsController from '../controllers/ratingsController.js';

const router = Router();

router.get('/tags', ratingsController.getTags);

router.get('/characters/:slug', ratingsController.getCharactersByCategory);

router.post('/reclassify/:characterId', ratingsController.reclassifyCharacter);

export default router;

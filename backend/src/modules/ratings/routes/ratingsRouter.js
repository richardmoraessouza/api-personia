import { Router } from 'express';
import * as ratingsController from '../controllers/ratingsController.js';

const router = Router();

// Endpoint for the frontend to list categories and build filters
router.get('/tags', ratingsController.getTags);

// Endpoint to fetch characters filtered by their category slug
router.get('/characters/:slug', ratingsController.getCharactersByCategory);

// Endpoint to manually trigger or update the AI classification for a specific bot
router.post('/reclassify/:characterId', ratingsController.reclassifyCharacter);

export default router;
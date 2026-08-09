import { Router } from "express";
import { updateCharacter, search, getDataCharacter, getDataCharacterByPublicId, getSearchCharacter,
        createCharacterHandler, handleSaveRecentCharacter,
        handleGetRecentCharacters, getCharacterProfile, countCharacterView, countCharacterViewByPublicId,
        getExploreCharacters, updateCharacterVisibilityHandler } from "../controllers/characterController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";
import { optionalVerifyToken } from "../../../middleware/optionalVerifyToken.js";
import { 
  validateCharacterId, 
  validateUsuarioId,
  validateCharacterSearch,
  validateCreateCharacter,
  validateUpdateCharacter,
  validateRecentCharacter
} from "../../../middleware/inputValidators.js";

const router = Router();

// Get characters by user ID
router.get('/user-search-by-id/:usuarioId', optionalVerifyToken, validateUsuarioId, search);

// Search character by name
router.get('/search-character', validateCharacterSearch, getSearchCharacter);

// Get characters for the Explore tab with pagination and division (Half Popular / Half New)
router.get('/explore', getExploreCharacters);

router.get('/data-character-by-id/:id', optionalVerifyToken, validateCharacterId, getDataCharacter);

router.get('/data-character-by-public-id/:publicId', optionalVerifyToken, getDataCharacterByPublicId);

// Update character by ID (requires authentication)
router.put('/update-character/:id', verifyToken, validateUpdateCharacter, updateCharacter);

// Update character visibility by publicId (requires authentication)
router.patch('/update-visibility/:publicId', verifyToken, updateCharacterVisibilityHandler);

// Create new character (requires authentication)
router.post('/create-character/:usuarioId', verifyToken, validateCreateCharacter, createCharacterHandler);

// Save recent character interaction (requires authentication)
router.post('/recent-characters/:usuarioId/:personagemId', verifyToken, validateRecentCharacter, handleSaveRecentCharacter);

// Get list of 10 recent characters (requires authentication)
router.get('/get-recent-characters/:usuarioId', verifyToken, validateUsuarioId, handleGetRecentCharacters);

// Get character view history (requires authentication)
router.get('/character-views/:id', verifyToken, validateCharacterId, getCharacterProfile);

// Count character views
router.post('/increment-chat-views/:id', verifyToken, validateCharacterId, countCharacterView);

// Count character views by public_id
router.post('/increment-chat-views-public/:publicId', verifyToken, countCharacterViewByPublicId);

export default router;

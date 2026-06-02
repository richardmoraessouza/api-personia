import { Router } from "express";
import { updateCharacter, search, getDataCharacter, getSearchCharacter,
        createCharacter, handleSaveRecentCharacter,
        handleGetRecentCharacters, getCharacterProfile, countCharacterView,
        getExploreCharacters } from "../controllers/personController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";
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
router.get('/user-search-by-id/:usuarioId', validateUsuarioId, search);

// Search character by name
router.get('/search-character', validateCharacterSearch, getSearchCharacter);

// Get characters for the Explore tab with pagination and division (Half Popular / Half New)
router.get('/explore', getExploreCharacters); 

// Get character data by ID
router.get('/data-character-by-id/:id', validateCharacterId, getDataCharacter);

// Update character by ID (requires authentication)
router.put("/update-character/:id", verifyToken, validateUpdateCharacter, updateCharacter);

// Create new character (requires authentication)
router.post('/create-character/:usuarioId', verifyToken, validateCreateCharacter, createCharacter);

// Save recent character interaction (requires authentication)
router.post('/recent-characters/:usuarioId/:personagemId', validateRecentCharacter, handleSaveRecentCharacter);

// Get list of 10 recent characters (requires authentication)
router.get('/get-recent-characters/:usuarioId', validateUsuarioId, handleGetRecentCharacters);

// Get character view history (requires authentication)
router.get('/character-views/:id', verifyToken, validateCharacterId, getCharacterProfile);

// Count character views
router.post('/increment-chat-views/:id', verifyToken, validateCharacterId, countCharacterView);

export default router;
import { Router } from "express";
import { updateCharacter, search, getDataPerson, getSearchPerson,
        characters, createPerson, handleSaveRecentCharacter,
        handleGetRecentCharacters, getCharacterProfile, countCharacterView } from "../controllers/personController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";

const router = Router();

// Get characters by user ID
router.get('/user-search-by-id/:usuarioId', search);

// Search character by name
router.get('/search-character', getSearchPerson);

// Get all characters (explore)
router.get('/explore', characters);

// Get character data by ID
router.get('/data-character/:id', getDataPerson);

// Update character by ID (requires authentication)
router.put("/update-character/:id", verifyToken, updateCharacter);

// Create new character (requires authentication)
router.post('/create-character/:usuarioId', verifyToken, createPerson);

// Save recent character interaction (called from chat)
// Maps POST request with userId and characterId parameters
router.post('/recent-characters/:usuarioId/:personagemId', handleSaveRecentCharacter);

// Get list of 10 recent characters (called from profile)
// Maps GET request with only userId parameter
router.get('/get-recent-characters/:usuarioId', handleGetRecentCharacters);

// Get character view history (requires authentication)
router.get('/character-views/:id', verifyToken, getCharacterProfile);

// Count character views
// React calls this endpoint when sending message
// verifyToken middleware ensures req.user.id exists in controller
router.get('/increment-chat-views/:id', verifyToken, countCharacterView);

export default router;
import { Router } from "express";
import { updateCharacter, search, getDataCharacter, getSearchCharacter,
        createCharacter, handleSaveRecentCharacter,
        handleGetRecentCharacters, getCharacterProfile, countCharacterView,
        getExploreCharacters } from "../controllers/personController.js"; // 🔥 Importe a nova função aqui
import { verifyToken } from "../../../middleware/verifyToken.js";

const router = Router();

// Get characters by user ID
router.get('/user-search-by-id/:usuarioId', search);

// Search character by name
router.get('/search-character', getSearchCharacter);

// Get characters for the Explore tab with pagination and division (Half Popular / Half New)
router.get('/explore', getExploreCharacters); 

// Get character data by ID
router.get('/data-character-by-id/:id', getDataCharacter);

// Update character by ID (requires authentication)
router.put("/update-character/:id", verifyToken, updateCharacter);

// Create new character (requires authentication)
router.post('/create-character/:usuarioId', verifyToken, createCharacter);

// Save recent character interaction
router.post('/recent-characters/:usuarioId/:personagemId', handleSaveRecentCharacter);

// Get list of 10 recent characters
router.get('/get-recent-characters/:usuarioId', handleGetRecentCharacters);

// Get character view history (requires authentication)
router.get('/character-views/:id', verifyToken, getCharacterProfile);

// Count character views
router.post('/increment-chat-views/:id', verifyToken, countCharacterView);

export default router;
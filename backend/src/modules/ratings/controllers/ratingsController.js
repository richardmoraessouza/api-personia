import * as ratingsService from '../services/ratingsService.js';

/**
 * Get all available categories/tags
 */
export const getTags = async (req, res) => {
  try {
    const tags = await ratingsService.listAllTags();
    return res.status(200).json(tags);
  } catch (error) {
    console.error("[Ratings Controller] Error in getTags:", error.message);
    return res.status(500).json({ error: "Internal server error fetching tags." });
  }
};

/**
 * Trigger or manually update AI classification for an existing character
 */
export const reclassifyCharacter = async (req, res) => {
  const { characterId } = req.params;
  const characterData = req.body;

  if (!characterId) {
    return res.status(400).json({ error: "Character ID is required." });
  }

  try {
    const tagsIdentified = await ratingsService.handleAutoClassification(characterId, characterData);
    return res.status(200).json({ 
      message: "Character reclassified successfully!", 
      tags: tagsIdentified 
    });
  } catch (error) {
    console.error("[Ratings Controller] Error in reclassifyCharacter:", error.message);
    return res.status(500).json({ error: "Error processing character classification." });
  }
};

/**
 * Fetch characters matching the specific category slug sent via URL parameters
 */
export const getCharactersByCategory = async (req, res) => {
  const { slug } = req.params;
  
  // Increased default limit to 30 for seamless infinite scroll
  const limit = parseInt(req.query.limit) || 15;   
  const offset = parseInt(req.query.offset) || 0;  

  if (!slug) {
    return res.status(400).json({ error: "Category slug parameter is required." });
  }

  try {
    const cleanSlug = slug.toLowerCase();
    const characters = await ratingsService.getCharactersByTag(cleanSlug, limit, offset);
    return res.status(200).json(characters);
  } catch (error) {
    console.error("[Ratings Controller] Error in getCharactersByCategory:", error.message);
    return res.status(500).json({ error: "Error fetching characters for this category." });
  }
};
import * as characterService from '../services/CharacterService.js';
import * as personRepository from '../repositories/personRepository.js';

// Get characters by user ID
export const search = async (req, res) => {
  const usuarioId = req.params.usuarioId || req.query.usuarioId;

  if (!usuarioId) {
    return res.status(400).json({ success: false, error: 'Parameter usuarioId is required (path or query).' });
  }

  try {
    const personagens = await characterService.getCharactersByUser(usuarioId);

    // Return empty array with 200 status if no characters found
    return res.status(200).json(personagens || []);
  } catch (err) {
    console.error('Error loading user characters', err);
    return res.status(500).json({ success: false, error: 'Error loading user characters.' });
  }
};

// Get character data by ID
export const getDataCharacter = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Parameter id is required.' });
  }

  try {
    const personagem = await characterService.getDataCharacterById(id);

    if (!personagem) {
      return res.status(404).json({ success: false, error: 'Character not found.' });
    }

    return res.json(personagem);
  } catch (err) {
    console.error('Error searching character:', err);
    return res.status(500).json({ success: false, error: 'Internal error while searching character.' });
  }
};

// Search character by name
export const getSearchCharacter = async (req, res) => {
  const { nomePersonagem } = req.query;

  if (!nomePersonagem) {
    return res.status(400).json({ success: false, error: 'The characterName parameter is required.' });
  }

  try {
    const resultados = await characterService.getCharactersSearchService(nomePersonagem);

    if (resultados.length === 0) {
      return res.status(404).json({ success: false, message: 'No character found with that name.' });
    }

    return res.status(200).json({ success: true, resultados });
  } catch (err) {
    console.error('Error searching character:', err);
    return res.status(500).json({ success: false, error: 'Internal error while searching character.' });
  }
};

// Update character by ID
export const updateCharacter = async (req, res) => {
  const { id } = req.params;

  try {
    const personagemAtualizado = await characterService.updateCharacterService(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Personagem atualizado com sucesso!',
      personagem_atualizado: personagemAtualizado
    });
  } catch (err) {
    console.error('Error updating character:', err);

    if (err.message === 'PERSONAGEM_NAO_ENCONTRADO') {
      return res.status(404).json({
        success: false,
        error: 'Character not found.'
      });
    }

    return res.status(500).json({
      success: false,
        error: 'Internal error while updating character.'
    });
  }
};

// Route to create character
export const createCharacter = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const novoPersonagem = await characterService.createCharacterService({ ...req.body, usuarioId });

    return res.status(201).json({
      success: true,
      message: 'Personagem criado com sucesso!',
      personagem: novoPersonagem
    });

  } catch (err) {
    console.error('Error creating character:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao criar personagem.' });
  }
  
}

//save recent character interaction
export const handleSaveRecentCharacter = async (req, res) => {
  try {
    const { usuarioId, personagemId } = req.params;

    if (isNaN(Number(usuarioId)) || isNaN(Number(personagemId))) {
      return res.status(400).json({ error: 'Invalid IDs.' });
    }

    await characterService.saveRecentCharacterService(Number(usuarioId), Number(personagemId));

    return res.status(200).json({ success: true, message: 'Recente atualizado!' });
  } catch (error) {
    console.error('Erro ao salvar recente:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar personagem recente.' });
  }
};

// show the 10 most recent characters of a user
export const handleGetRecentCharacters = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (isNaN(Number(usuarioId))) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const personagens = await characterService.getRecentCharactersService(Number(usuarioId));

    return res.status(200).json(personagens);
  } catch (error) {
    console.error('Erro ao buscar recentes:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar personagens recentes.' });
  }
};

// Route that loads the complete character profile and counts unique user access
export const getCharacterProfile = async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!characterId) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    // 1. Run unified service function to check/count view
    await characterService.registerUniqueViewService(userId, characterId);

    // push the updated character data
    const personagem = await characterService.getDataCharacterById(characterId);

    if (!personagem) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    return res.json(personagem);
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor', details: error.message });
  }
};

// Route that sends view count to character table
export const countCharacterView = async (req, res) => {
  try {
    const characterId = parseInt(req.params.id);
    const userId = req.user.id;

    if (!characterId) {
      return res.status(400).json({ error: 'Invalid character ID' });
    }

    // Call same unified service function
    const isNewView = await characterService.registerUniqueViewService(userId, characterId);

    if (isNewView) {
      return res.json({ 
        success: true, 
        message: 'View counted successfully!' 
      });
    }

    return res.json({ 
      success: true, 
      message: 'User already viewed this character. Count ignored.' 
    });

  } catch (error) {
    console.error("Error running view logic:", error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
};

// Route to get characters for explore page with pagination and popularity seeding
export const getExploreCharacters = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const seed = Number(req.query.seed) || 0.5;

    const popularWeek = await characterService.getPopularWeekService();

    const popularIds =
      popularWeek?.length > 0
        ? popularWeek.map(char => char.id)
        : [];

    const characters = await personRepository.getCharactersPaginated(
      limit,
      offset,
      seed,
      popularIds
    );

    res.json(characters);
  } catch (error) {
    console.error("Erro na rota de explorar:", error);
    res.status(500).json({
      error: error.message
    });
  }
};
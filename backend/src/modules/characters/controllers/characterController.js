import {
  getCharactersByUser,
  getDataCharacterById,
  getDataCharacterByPublicId as getCharacterDataByPublicIdService,
  getPublicCharacterById,
  getCharactersSearchService,
  getExploreCharactersService,
  updateCharacterService,
  createCharacterService,
  saveRecentCharacterService,
  getRecentCharactersService,
  getCharacterProfileService,
  registerUniqueViewService,
  registerUniqueViewServiceByPublicId,
  resolveCharacterIdService,
  VisibilityService
} from '../services/CharacterService.js';

export const search = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const requesterUsuarioId = req.user?.id || null;
    const characters = await getCharactersByUser(usuarioId, requesterUsuarioId);
    res.json(characters);
  } catch (error) {
    console.error('Error in search handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSearchCharacter = async (req, res) => {
  try {
    const { nomePersonagem, q, tag, limit = 20, offset = 0 } = req.query;
    const searchTerm = (nomePersonagem || q)?.toString().trim();

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const characters = await getCharactersSearchService(searchTerm, tag || '', parseInt(limit), parseInt(offset));
    res.json(characters);
  } catch (error) {
    console.error('Error in getSearchCharacter handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getExploreCharacters = async (req, res) => {
  try {
    const { limit = 20, offset = 0, seed = 0.5, popularIds = '' } = req.query;
    const popularIdsList = popularIds ? popularIds.split(',').map(Number) : [];
    const characters = await getExploreCharactersService(parseInt(limit), parseInt(offset), parseFloat(seed), popularIdsList);
    res.json(characters);
  } catch (error) {
    console.error('Error in getExploreCharacters handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDataCharacter = async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = Number(req.user?.id);
    const character = await getPublicCharacterById(id);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const isOwner = authenticatedUserId && authenticatedUserId === Number(character.usuario_id);
    if (character.is_public === false && !isOwner) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character);
  } catch (error) {
    console.error('Error in getDataCharacter handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDataCharacterByPublicId = async (req, res) => {
  try {
    const { publicId } = req.params;
    const character = await getCharacterDataByPublicIdService(publicId);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const authenticatedUserId = Number(req.user?.id);
    const isOwner = authenticatedUserId && authenticatedUserId === Number(character.usuario_id);

    if (character.is_public === false && !isOwner) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character);
  } catch (error) {
    console.error('Error in getDataCharacterByPublicId handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resolveCharacterId = async (identifier) => resolveCharacterIdService(identifier);

const ensureCharacterOwnership = async (req, res, characterId) => {
  const authenticatedUserId = Number(req.user?.id);
  if (!Number.isInteger(authenticatedUserId)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  const character = await getDataCharacterById(characterId);
  if (!character) {
    res.status(404).json({ error: 'Character not found' });
    return null;
  }

  if (authenticatedUserId !== Number(character.usuario_id)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return character;
};

export const updateCharacter = async (req, res) => {
  try {
    const { id } = req.params;
    const resolvedCharacterId = await resolveCharacterIdService(id);

    if (!resolvedCharacterId) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const character = await ensureCharacterOwnership(req, res, resolvedCharacterId);
    if (!character) {
      return;
    }

    const body = req.body || {};
    const isQuickMode = Boolean(body.is_modo_rapido);
    const hasQuickFields = typeof body.quick_prompt === 'string' && body.quick_prompt.trim() !== '';
    const hasDetailedFields = [
      'personalidade',
      'regras',
      'historia',
      'aparencia',
      'gostos',
      'desgostos',
      'objetivos',
      'primeiramensagem',
      'relacaousuario',
      'cenario'
    ].some((field) => typeof body[field] === 'string' && body[field].trim() !== '');

    if (isQuickMode && hasDetailedFields) {
      return res.status(400).json({ error: 'O modo rápido e o modo detalhado não podem ser enviados juntos.' });
    }

    if (!isQuickMode && hasQuickFields) {
      return res.status(400).json({ error: 'O modo rápido e o modo detalhado não podem ser enviados juntos.' });
    }

    const characterData = body;
    const updatedCharacter = await updateCharacterService(resolvedCharacterId, characterData);

    if (!updatedCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(updatedCharacter);
  } catch (error) {
    console.error('Error in updateCharacter handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCharacterHandler = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const authenticatedUserId = Number(req.user?.id);

    if (!Number.isInteger(authenticatedUserId) || authenticatedUserId !== Number(usuarioId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const body = req.body || {};
    const isQuickMode = Boolean(body.is_modo_rapido);
    const hasQuickFields = typeof body.quick_prompt === 'string' && body.quick_prompt.trim() !== '';
    const hasDetailedFields = [
      'personalidade',
      'regras',
      'historia',
      'aparencia',
      'gostos',
      'desgostos',
      'objetivos',
      'primeiramensagem',
      'relacaousuario',
      'cenario'
    ].some((field) => typeof body[field] === 'string' && body[field].trim() !== '');

    if (isQuickMode && hasDetailedFields) {
      return res.status(400).json({ error: 'O modo rápido e o modo detalhado não podem ser enviados juntos.' });
    }

    if (!isQuickMode && hasQuickFields) {
      return res.status(400).json({ error: 'O modo rápido e o modo detalhado não podem ser enviados juntos.' });
    }

    const characterData = { ...body, usuario_id: authenticatedUserId };
    const newCharacter = await createCharacterService(characterData);
    res.status(201).json(newCharacter);
  } catch (error) {
    console.error('Error in createCharacterHandler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleSaveRecentCharacter = async (req, res) => {
  try {
    const { usuarioId, personagemId } = req.params;
    const authenticatedUserId = Number(req.user?.id);

    if (!Number.isInteger(authenticatedUserId) || authenticatedUserId !== Number(usuarioId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const resolvedId = await resolveCharacterIdService(personagemId);

    if (!resolvedId) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const result = await saveRecentCharacterService(usuarioId, resolvedId);
    res.json(result);
  } catch (error) {
    console.error('Error in handleSaveRecentCharacter handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const handleGetRecentCharacters = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const authenticatedUserId = Number(req.user?.id);

    if (!Number.isInteger(authenticatedUserId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const isOwner = authenticatedUserId === Number(usuarioId);
    const characters = await getRecentCharactersService(usuarioId, isOwner);
    res.json(characters);
  } catch (error) {
    console.error('Error in handleGetRecentCharacters handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCharacterProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const character = await getCharacterProfileService(id);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character);
  } catch (error) {
    console.error('Error in getCharacterProfile handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const countCharacterView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const character = await getDataCharacterById(id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const wasFirstView = await registerUniqueViewService(userId, id);
    res.json({ success: true, views: (character.visualizacoes || 0) + (wasFirstView ? 1 : 0) });
  } catch (error) {
    console.error('Error in countCharacterView handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const countCharacterViewByPublicId = async (req, res) => {
  try {
    const { publicId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const character = await getCharacterDataByPublicIdService(publicId);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const wasFirstView = await registerUniqueViewServiceByPublicId(userId, publicId);
    res.json({ success: true, views: (character.visualizacoes || 0) + (wasFirstView ? 1 : 0) });
  } catch (error) {
    console.error('Error in countCharacterViewByPublicId handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCharacterVisibilityHandler = async (req, res) => {
  try {
    const { publicId } = req.params;
    const { is_public: isPublic } = req.body;
    const character = await getCharacterDataByPublicIdService(publicId);

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const authenticatedUserId = Number(req.user?.id);
    if (!Number.isInteger(authenticatedUserId) || authenticatedUserId !== Number(character.usuario_id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedCharacter = await VisibilityService(publicId, isPublic);

    if (!updatedCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(updatedCharacter);
  } catch (error) {
    console.error('Error in updateCharacterVisibilityHandler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
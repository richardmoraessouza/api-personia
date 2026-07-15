import * as personRepository from '../repositories/characterRepository.js';
import * as cacheService from '../../../services/cacheService.js';

const CACHE_TTL = {
  CHARACTER: 5 * 60,
  CHARACTER_LIST: 10 * 60,
  SEARCH: 15 * 60,
  RECENT: 5 * 60,
  POPULAR: 2 * 60 * 60
};

export const getCharactersByUser = async (usuarioId, requesterUsuarioId = null) => {
  const isOwner = requesterUsuarioId && Number(requesterUsuarioId) === Number(usuarioId);
  const cacheKey = `character:user:${usuarioId}:${isOwner ? 'owner' : 'public'}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.getCharactersByUsuarioId(usuarioId, requesterUsuarioId),
    CACHE_TTL.CHARACTER_LIST
  );
};

export const getDataCharacterById = async (id) => {
  const cacheKey = `character:id:${id}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.findDataCharacterById(id),
    CACHE_TTL.CHARACTER
  );
};

export const getPublicCharacterById = async (id) => {
  const cacheKey = `character:public:${id}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.findPublicCharacterById(id),
    CACHE_TTL.CHARACTER
  );
};

export const getDataCharacterByPublicId = async (publicId) => {
  const cacheKey = `character:public_id:${publicId}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.findDataCharacterByPublicId(publicId),
    CACHE_TTL.CHARACTER
  );
};

export const getCharactersSearchService = async (nomePersonagem, tagSlug = '', limit = 20, offset = 0) => {
  const lowerTerm = nomePersonagem.toLowerCase();
  const cacheKey = `character:search:v2:${lowerTerm}:${tagSlug}:${limit}:${offset}`;

  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.searchCharactersByNameAndTag(nomePersonagem, tagSlug, limit, offset),
    CACHE_TTL.SEARCH
  );
};

export const updateCharacterService = async (id, personData) => {
  const updatedCharacter = await personRepository.updateCharacterById(id, personData);

  if (updatedCharacter) {
    const charCacheKey = `character:id:${id}`;
    const userCacheKey = `character:user:${updatedCharacter.usuario_id}`;

    try {
      await Promise.all([
        cacheService.cacheDel(charCacheKey),
        cacheService.cacheDel(userCacheKey)
      ]);

      console.log(`[Redis] Cache invalidado instantaneamente para a lista do usuário e o bot ID: ${id}`);
    } catch (cacheErr) {
      console.warn(`[Redis ERROR] Falha ao deletar chaves no update:`, cacheErr.message);
    }
  }

  return updatedCharacter;
};

export const getCharactersService = async (page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const cacheKey = `character:explore:${page}:${limit}`;

  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.getCharactersPaginated(limit, offset),
    CACHE_TTL.CHARACTER_LIST
  );
};

export const getExploreCharactersService = async (limit = 20, offset = 0, seed = 0.5, popularIds = []) => {
  return personRepository.getCharactersPaginated(limit, offset, seed, popularIds);
};

export const getPersonCreatedByUserService = async (id) => {
  const cacheKey = `character:created:${id}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.createCharacter(id),
    CACHE_TTL.CHARACTER_LIST
  );
};

export const createCharacterService = async (data) => {
  const personajeCriado = await personRepository.createCharacter(data);

  if (!personajeCriado) {
    throw new Error('ERRO_AO_CRIAR_PERSONAGEM');
  }

  await cacheService.cacheDel('character:explore:1:50');

  if (data.usuario_id) {
    await cacheService.cacheDel(`character:user:${data.usuario_id}`);
  }

  return personajeCriado;
};

export const saveRecentCharacterService = async (usuarioId, personagemId) => {
  if (!usuarioId || !personagemId) {
    throw new Error('INVALID_PARAMETERS');
  }

  const resultado = await personRepository.saveRecentCharacter(usuarioId, personagemId);
  await cacheService.cacheDel(`character:recent:${usuarioId}`);

  return resultado;
};

export const getRecentCharactersService = async (usuarioId, isOwner = false) => {
  if (!usuarioId) {
    throw new Error('USER_NOT_PROVIDED');
  }

  if (!isOwner) {
    const privacyFlags = await personRepository.findUserPrivacyFlags(usuarioId);
    if (privacyFlags?.hide_recent_character) {
      return [];
    }
  }

  const cacheKey = `character:recent:${usuarioId}:${isOwner ? 'owner' : 'public'}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.findRecentCharacters(usuarioId),
    CACHE_TTL.RECENT
  );
};

export const registerUniqueViewService = async (usuarioId, personajeId) => {
  if (!usuarioId || !personajeId) {
    throw new Error('INVALID_PARAMETERS');
  }

  const isFirstTime = await personRepository.registerViewHistory(usuarioId, personajeId);

  if (isFirstTime === 1) {
    await personRepository.incrementViews(personajeId);
    await cacheService.cacheDel(`character:id:${personajeId}`);
    return true;
  }

  return false;
};

export const registerUniqueViewServiceByPublicId = async (usuarioId, publicId) => {
  if (!usuarioId || !publicId) {
    throw new Error('INVALID_PARAMETERS');
  }

  const characterId = await personRepository.resolveCharacterId(publicId);

  if (!characterId) {
    throw new Error('CHARACTER_NOT_FOUND');
  }

  const isFirstTime = await personRepository.registerViewHistory(usuarioId, characterId);

  if (isFirstTime === 1) {
    await personRepository.incrementViews(characterId);
    await cacheService.cacheDel(`character:id:${characterId}`);
    await cacheService.cacheDel(`character:public_id:${publicId}`);
    return true;
  }

  return false;
};

export const getCharacterProfileService = async (id) => {
  const character = await personRepository.findDataCharacterById(id);
  return character ? { ...character, views: character.visualizacoes || 0 } : null;
};

export const resolveCharacterIdService = async (identifier) => personRepository.resolveCharacterId(identifier);

export const getPopularWeekService = async () => {
  const cacheKey = 'popular:week:characters';

  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.getPopularWeekCharacters(),
    CACHE_TTL.POPULAR
  );
};

export const VisibilityService = async (publicId, isPublic) => {
  if (publicId === undefined || isPublic === undefined) {
    throw new Error('INVALID_PARAMETERS');
  }

  const updatedCharacter = await personRepository.updateCharacterVisibility(publicId, isPublic);

  if (updatedCharacter) {
    const charCacheKey = `character:public_id:${publicId}`;
    const cacheKeysToDelete = [
      charCacheKey,
      `character:user:${updatedCharacter.usuario_id}:owner`,
      `character:user:${updatedCharacter.usuario_id}:public`
    ];

    if (updatedCharacter.usuario_id != null) {
      cacheKeysToDelete.push(`character:recent:${updatedCharacter.usuario_id}`);
    }

    try {
      await Promise.all([
        ...cacheKeysToDelete.map((key) => cacheService.cacheDel(key)),
        cacheService.cacheInvalidatePattern('explore:*'),
        cacheService.cacheInvalidatePattern('character:explore:*')
      ]);
      console.log(`[Redis] Cache de visibilidade invalidado para o bot: ${publicId}`);
    } catch (cacheErr) {
      console.warn(`[Redis ERROR] Falha ao deletar chaves na alteração de visibilidade:`, cacheErr.message);
    }
  }

  return updatedCharacter;
};
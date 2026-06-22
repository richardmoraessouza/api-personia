import * as personRepository from '../repositories/characterRepository.js';
import * as cacheService from '../../../services/cacheService.js';
import { PERSONAGEM_RULES } from '../../../rules/personagemRules.js';

const CACHE_TTL = {
  CHARACTER: 5 * 60,        // 5 minutos para dados de personagem
  CHARACTER_LIST: 10 * 60,  // 10 minutos para listas
  SEARCH: 15 * 60,          // 15 minutos para buscas
  RECENT: 5 * 60,           // 5 minutos para recentes
  POPULAR: 2 * 60 * 60      // 2 horas para popular da semana
};

// Get characters by user ID
export const getCharactersByUser = async (usuarioId) => {
  const cacheKey = `character:user:${usuarioId}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.getCharactersByUsuarioId(usuarioId),
    CACHE_TTL.CHARACTER_LIST
  );
};

// Get character data by ID with caching
export const getDataCharacterById = async (id) => {
  const cacheKey = `character:id:${id}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.findDataCharacterById(id),
    CACHE_TTL.CHARACTER
  );
};

// Search for characters by name and tag with caching
export const getCharactersSearchService = async (nomePersonagem, tagSlug = '') => {
  const lowerTerm = nomePersonagem.toLowerCase();
  const cacheKey = `character:search:${lowerTerm}:${tagSlug}`;
  
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.searchCharactersByNameAndTag(nomePersonagem, tagSlug),
    CACHE_TTL.SEARCH
  );
};

// Update character by ID and clear ONLY its specific cache
export const updateCharacterService = async (id, personData) => {
  // 1. Atualiza no banco
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

// Get all characters (explore)
export const getCharactersService = async (page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const cacheKey = `character:explore:${page}:${limit}`;
  
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.getCharactersPaginated(limit, offset),
    CACHE_TTL.CHARACTER_LIST
  );
};

// Get person created by user
export const getPersonCreatedByUserService = async (id) => {
  const cacheKey = `character:created:${id}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.createCharacter(id),
    CACHE_TTL.CHARACTER_LIST
  );
};

// ─── ARRUMADO: CRIAÇÃO CIRÚRGICA ─────────────────────────────────────────
// Create new character
export const createCharacterService = async (data) => {
  const personajeCriado = await personRepository.createCharacter(data);
  
  if (!personajeCriado) {
    throw new Error('ERRO_AO_CRIAR_PERSONAGEM');
  }

  // Quando um bot novo nasce, não precisamos quebrar o cache de busca de termos antigos.
  // Limpamos apenas o cache do feed da primeira página para ele aparecer no topo do Explore.
  await cacheService.cacheDel('character:explore:1:50');
  
  // Se o criador tiver cache da lista de bots dele, limpa para atualizar a dashboard dele
  if (data.usuario_id) {
    await cacheService.cacheDel(`character:user:${data.usuario_id}`);
  }
  
  return personajeCriado;
};
// ─────────────────────────────────────────────────────────────────────────

// Service to save recent character interaction
export const saveRecentCharacterService = async (usuarioId, personagemId) => {
  if (!usuarioId || !personagemId) {
    throw new Error('INVALID_PARAMETERS');
  }

  const resultado = await personRepository.saveRecentCharacter(usuarioId, personagemId);
  
  // Invalida cache de recentes para forçar atualização
  await cacheService.cacheDel(`character:recent:${usuarioId}`);
  
  return resultado;
};

// Service to get 10 recent characters (with cache)
export const getRecentCharactersService = async (usuarioId) => {
  if (!usuarioId) {
    throw new Error('USER_NOT_PROVIDED');
  }

  const cacheKey = `character:recent:${usuarioId}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.findRecentCharacters(usuarioId),
    CACHE_TTL.RECENT
  );
};

// Service to register view counter
export const registerUniqueViewService = async (usuarioId, personajeId) => {
  if (!usuarioId || !personajeId) {
    throw new Error('INVALID_PARAMETERS');
  }

  const isFirstTime = await personRepository.registerViewHistory(usuarioId, personajeId);

  if (isFirstTime === 1) {
    await personRepository.incrementViews(personajeId); 
    
    // Invalida caches de dados do personagem
    await cacheService.cacheDel(`character:id:${personajeId}`);
    return true;
  }

  return false;
};

// Get popular week characters with Redis cache
export const getPopularWeekService = async () => {
  const cacheKey = 'popular:week:characters';

  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.findPopularWeek(),
    CACHE_TTL.POPULAR
  );
};
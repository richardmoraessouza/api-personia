import * as personRepository from '../repositories/personRepository.js';
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

// Search for characters by name with caching
export const getCharactersSearchService = async (nomePersonagem) => {
  const lowerTerm = nomePersonagem.toLowerCase();
  const cacheKey = `character:search:${lowerTerm}`;
  
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => personRepository.searchCharactersByName(nomePersonagem),
    CACHE_TTL.SEARCH
  );
};

// Update character by ID and clear cache
export const updateCharacterService = async (id, data) => {
  const figurinhas = Array.isArray(data.figurinhas)
    ? data.figurinhas.filter(Boolean)
    : data.figurinhas;

  const personagemAtualizado = await personRepository.updateCharacterById(id, {
    ...data,
    figurinhas
  });

  if (!personagemAtualizado) {
    throw new Error(PERSONAGEM_RULES.PERSONAGEM_NAO_ENCONTRADO_ERROR);
  }

  // Invalida caches relacionados
  await cacheService.cacheInvalidatePattern('character:*');
  
  return personagemAtualizado;
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

// Create new character
export const createCharacterService = async (data) => {
  const personagemCriado = await personRepository.createCharacter(data);
  
  if (!personagemCriado) {
    throw new Error('ERRO_AO_CRIAR_PERSONAGEM');
  }

  // Invalida caches ao criar novo personagem
  await cacheService.cacheInvalidatePattern('character:*');
  
  return personagemCriado;
};

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

// UNIFIED FUNCTION: Register unique character view
export const registerUniqueViewService = async (usuarioId, personajeId) => {
  if (!usuarioId || !personajeId) {
    throw new Error('INVALID_PARAMETERS');
  }

  // 1. Try to register view history in database
  const isFirstTime = await personRepository.registerViewHistory(usuarioId, personajeId);

  // 2. If first time user viewing, increment +1 to view counter
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
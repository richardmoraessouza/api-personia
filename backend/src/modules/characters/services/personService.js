import * as personRepository from '../repositories/personRepository.js';
import { PERSONAGEM_RULES } from '../../../rules/personagemRules.js';

const caches = {
  byUsuario: new Map(),
  byId: new Map(),
  byNameSearch: new Map(),
  byList: new Map(),
  byRecent: new Map()
};

function setCache(map, key, value) {
  map.set(key, { value, expires: Date.now() + PERSONAGEM_RULES.CACHE_TTL });
}

function getCache(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    map.delete(key);
    return null;
  }
  return entry.value;
}

export const clearPersonCaches = () => {
  caches.byUsuario.clear();
  caches.byId.clear();
  caches.byNameSearch.clear();
  caches.byList.clear();
  caches.byList.clear();
  caches.byRecent.clear();
};

// Get characters by user ID
export const getCharactersByUser = async (usuarioId) => {
  const cached = getCache(caches.byUsuario, usuarioId);
  if (cached) {
    return cached;
  }

  const personagens = await personRepository.getCharactersByUsuarioId(usuarioId);
  setCache(caches.byUsuario, usuarioId, personagens);
  return personagens;
};

// Get character data by ID with caching
export const getDataCharacterById = async (id) => {
  const cached = getCache(caches.byId, id);
  if (cached) {
    return cached;
  }

  const personagem = await personRepository.findDataCharacterById(id);
  if (personagem) {
    setCache(caches.byId, id, personagem);
  }

  return personagem;
};

// Search for characters by name with caching
export const getCharactersSearchService = async (nomePersonagem) => {
  const lowerTerm = nomePersonagem.toLowerCase();
  const cached = getCache(caches.byNameSearch, lowerTerm);
  if (cached) {
    return cached;
  }

  const resultados = await personRepository.searchCharactersByName(nomePersonagem);
  setCache(caches.byNameSearch, lowerTerm, resultados);
  return resultados;
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

  clearPersonCaches();
  return personagemAtualizado;
};

// Get all characters (explore)
export const getCharactersService = async (page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const cacheKey = `${page}:${limit}`;
  const cached = getCache(caches.byList, cacheKey);
  if (cached) return cached;

  const personagens = await personRepository.getCharactersPaginated(limit, offset);
  setCache(caches.byList, cacheKey, personagens);
  return personagens;
};

// ?????????????????
export const getPersonCreatedByUserService = async (id) => {
  const cached = getCache(caches.byUsuario, id);

  if (cached) {
    return cached;
  }

  const personagens = await personRepository.createCharacter(id);
  setCache(caches.byUsuario, id, personagens);
  return personagens;
};

// Create new character
export const createCharacterService = async (data) => {
  const personagemCriado = await personRepository.createCharacter(data);
  
  if (!personagemCriado) {
    throw new Error('ERRO_AO_CRIAR_PERSONAGEM');
  }

  clearPersonCaches();
  return personagemCriado;
};

// Service to save recent character interaction
export const saveRecentCharacterService = async (usuarioId, personagemId) => {
  if (!usuarioId || !personagemId) {
    throw new Error('INVALID_PARAMETERS');
  }

  const resultado = await personRepository.saveRecentCharacter(usuarioId, personagemId);
  
  // Clear cache of recent characters for user to force system to fetch new data in profile
  caches.byRecent.delete(usuarioId); 
  
  return resultado;
};

// Service to get 10 recent characters (with cache)
export const getRecentCharactersService = async (usuarioId) => {
  if (!usuarioId) {
    throw new Error('USER_NOT_PROVIDED');
  }

  // Try to get from cache first
  const cached = getCache(caches.byRecent, usuarioId);
  if (cached) {
    return cached;
  }

  // Fetch from database through repository
  const recentCharacters = await personRepository.findRecentCharacters(usuarioId);
  
  // Save to cache before returning
  setCache(caches.byRecent, usuarioId, recentCharacters);

  return recentCharacters;
};

// UNIFIED FUNCTION: Register unique character view
// Controls unique view tracking and clears cache

export const registerUniqueViewService = async (usuarioId, personajeId) => {
  if (!usuarioId || !personajeId) {
    throw new Error('INVALID_PARAMETERS');
  }

  // 1. Try to register view history in database (returns 1 if first time, 0 if repeated)
  const isFirstTime = await personRepository.registerViewHistory(usuarioId, personajeId);

  // 2. If first time user viewing, increment +1 to view counter
  if (isFirstTime === 1) {
    // CORRIGIDO: de personagemId para personajeId
    await personRepository.incrementViews(personajeId); 
    
    // Clear in-memory caches so frontend sees updated view count
    clearPersonCaches();
    return true; // Returns true indicating view was counted
  }

  return false; // Returns false if user already viewed before
};
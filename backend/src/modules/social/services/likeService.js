import * as likeRepository from '../repositories/likeRepository.js';

const CACHE_TTL = 60 * 1000;
const likeCache = {
  countByPersonagem: new Map(),
  byUsuario: new Map()
};

function setCache(map, key, value) {
  map.set(key, { value, expires: Date.now() + CACHE_TTL });
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

// Clear specific like-related caches when a like is toggled
function clearLikeCaches(personagemId, usuarioId) {
  if (personagemId) likeCache.countByPersonagem.delete(personagemId);
  if (usuarioId) likeCache.byUsuario.delete(usuarioId);
}

// Toggle like for a character by a user
export const toggleLikeService = async (usuarioId, personagemId) => {
  clearLikeCaches(personagemId, usuarioId);

  const exists = await likeRepository.findLike(usuarioId, personagemId);

  if (exists) {
    await likeRepository.removeLike(usuarioId, personagemId);
    return { status: 200, liked: false, message: 'Like removed' };
  }

  await likeRepository.createLike(usuarioId, personagemId);
    return { status: 201, liked: true, message: 'Like added' };
};

//Get total likes count for a character
export const getLikesCountService = async (personagemId) => {
  const cached = getCache(likeCache.countByPersonagem, personagemId);
  if (cached != null) return cached;

  const total = await likeRepository.countLikesByPersonagem(personagemId);
  setCache(likeCache.countByPersonagem, personagemId, total);
  return total;
};

//Get all characters liked by a user
export const getLikesByUserService = async (usuarioId) => {
  const cached = getCache(likeCache.byUsuario, usuarioId);
  if (cached) return cached;

  const ids = await likeRepository.getLikesByUsuario(usuarioId);
  setCache(likeCache.byUsuario, usuarioId, ids);
  return ids;
};

// Clear all like-related caches (for testing or admin purposes)
export const clearCaches = () => {
  likeCache.countByPersonagem.clear();
  likeCache.byUsuario.clear();
};

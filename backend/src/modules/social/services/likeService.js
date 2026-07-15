import * as likeRepository from '../repositories/likeRepository.js';
import * as cacheService from '../../../services/cacheService.js';
import { resolveCharacterId } from '../../characters/repositories/characterRepository.js';

/**
 * CONFIGURAÇÃO DE CACHE
 * TTLs em segundos
 */
const CACHE_TTL = {
  LIKE_COUNT: 5 * 60,      // 5 minutos para contagem de likes
  USER_LIKES: 10 * 60      // 10 minutos para likes do usuário
};

// Toggle like for a character by a user
export const toggleLikeService = async (usuarioId, personagemId) => {
  const resolvedPersonagemId = await resolveCharacterId(personagemId);

  if (!resolvedPersonagemId) {
    return {
      status: 404,
      error: 'Personagem não encontrado'
    };
  }

  const exists = await likeRepository.findLike(usuarioId, resolvedPersonagemId);

  if (exists) {
    await likeRepository.removeLike(usuarioId, resolvedPersonagemId);
  } else {
    const wasInserted = await likeRepository.createLike(usuarioId, resolvedPersonagemId);
    if (!wasInserted) {
      // The like already existed (race condition), so remove it
      await likeRepository.removeLike(usuarioId, resolvedPersonagemId);
    }
  }

  // Invalida caches relacionados ao novo like/unlike
  await cacheService.cacheDel(`like:count:${resolvedPersonagemId}`);
  await cacheService.cacheDel(`like:user:${usuarioId}`);

  return {
    status: exists ? 200 : 201,
    liked: !exists,
    message: exists ? 'Like removed' : 'Like added'
  };
};

// Get total likes count for a character
export const getLikesCountService = async (personagemId) => {
  const resolvedPersonagemId = await resolveCharacterId(personagemId);
  if (!resolvedPersonagemId) return 0;

  const cacheKey = `like:count:${resolvedPersonagemId}`;
  
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => likeRepository.countLikesByPersonagem(resolvedPersonagemId),
    CACHE_TTL.LIKE_COUNT
  );
};

// Get all characters liked by a user
export const getLikesByUserService = async (usuarioId) => {
  const cacheKey = `like:user:${usuarioId}`;
  
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => likeRepository.getLikesByUsuario(usuarioId),
    CACHE_TTL.USER_LIKES
  );
};

// Clear all like-related caches (for testing or admin purposes)
export const clearCaches = async () => {
  await cacheService.cacheInvalidatePattern('like:*');
};

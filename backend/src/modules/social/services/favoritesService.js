import * as socialRepository from "../repositories/favoritesRepository.js";
import * as cacheService from "../../../services/cacheService.js";

/**
 * CONFIGURAÇÃO DE CACHE
 * TTLs em segundos
 */
const CACHE_TTL = {
  USER_FAVORITES: 10 * 60  // 10 minutos - favoritos do usuário
};

// Toggle favorite status for character
// Adds favorite if not exists, removes if already favorited
export const toggleFavoritesService = async (
  usuarioId,
  personagemId
) => {
  const favoritoExiste =
    await socialRepository.findFavorites(
      usuarioId,
      personagemId
    );

  // If favorite exists, remove it
  if (favoritoExiste) {
    await socialRepository.removeFavorite(
      usuarioId,
      personagemId
    );

    // Invalida cache de favoritos do usuário
    await cacheService.cacheDel(`favorite:user:${usuarioId}`);

    return {
      status: 200,
      favorited: false,
      message: 'Favorite removed'
    };
  }

  // Add new favorite
  await socialRepository.addFavorite(
    usuarioId,
    personagemId
  );

  // Invalida cache de favoritos do usuário
  await cacheService.cacheDel(`favorite:user:${usuarioId}`);

  return {
    status: 201,
    favorited: true,
    message: 'Favorite added'
  };
};

// =========================
// GET USER FAVORITES (com cache)
// =========================

export const getFavoritesUserService = async (usuarioId) => {
  const cacheKey = `favorite:user:${usuarioId}`;
  
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => socialRepository.findFavoritesUserByUser(usuarioId),
    CACHE_TTL.USER_FAVORITES
  );
};
import * as socialRepository from "../repositories/favoritesRepository.js";


// =========================
// CACHE MANAGEMENT
// =========================

const CACHE_TTL = 60 * 1000;

const favCache = {
  byUsuario: new Map(),
};

function setCache(map, key, value) {
  map.set(key, {
    value,
    expires: Date.now() + CACHE_TTL
  });
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

function clearFavCache(usuarioId) {
  favCache.byUsuario.delete(usuarioId);
}


// Toggle favorite status for character
// Adds favorite if not exists, removes if already favorited
export const toggleFavoritesService = async (
  usuarioId,
  personagemId
) => {

  // Clear user cache when toggling favorites
  clearFavCache(usuarioId);

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

  return {
    status: 201,
    favorited: true,
      message: 'Favorite added'
    };
};

// =========================
// GET USER FAVORITES
// =========================

export const getFavoritesUserService = async (usuarioId) => {

  const cached = getCache(
    favCache.byUsuario,
    usuarioId
  );

  if (cached) {
    return cached;
  }

  const favoritos =
    await socialRepository.findFavoritesUserByUser(
      usuarioId
    );

  setCache(
    favCache.byUsuario,
    usuarioId,
    favoritos
  );

  return favoritos;
};
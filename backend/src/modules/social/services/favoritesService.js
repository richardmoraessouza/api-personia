import * as socialRepository from "../repositories/favoritesRepository.js";


// =========================
// CACHE
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


// =========================
// TOGGLE FAVORITE
// =========================

export const toggleFavoritesService = async (
  usuarioId,
  personagemId
) => {

  // CLEAR USER CACHE
  clearFavCache(usuarioId);

  const favoritoExiste =
    await socialRepository.findFavorites(
      usuarioId,
      personagemId
    );

  // REMOVE FAVORITE
  if (favoritoExiste) {

    await socialRepository.removeFavorite(
      usuarioId,
      personagemId
    );

    return {
      status: 200,
      favorited: false,
      message: 'Favorito removido'
    };
  }

  // ADD FAVORITE
  await socialRepository.addFavorite(
    usuarioId,
    personagemId
  );

  return {
    status: 201,
    favorited: true,
    message: 'Favorito adicionado'
  };
};

// =========================
// LIST FAVORITES OF USER
// =========================

export const getFavoritesUserService = async (
  usuarioId
) => {

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
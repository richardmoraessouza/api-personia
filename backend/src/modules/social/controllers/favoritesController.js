import * as socialService from "../services/favoritesService.js";


// =========================
// ADD / REMOVE FAVORITE
// =========================
export const toggleFavorites = async (req, res) => {
  const { usuario_id, personagem_id } = req.params;

  try {

    const result = await socialService.toggleFavoritesService(
      Number(usuario_id),
      Number(personagem_id)
    );

    return res.status(result.status).json(result);

  } catch (err) {
    console.error("Erro ao favoritar:", err);

    return res.status(500).json({
      error: "Erro ao alterar favorito"
    });
  }
};

// =========================
// SEARCH USER FAVORITES
// =========================
export const getFavoritesUser = async (req, res) => {
  
  const idParam = req.params.usuarioId || req.params.usuario_id;
  const usuarioIdNum = Number(idParam);

  // SAFETY CHECK TO AVOID SENDING INVALID DATA TO THE DATABASE 
  if (!idParam || isNaN(usuarioIdNum)) {
    return res.status(400).json({ error: 'ID de usuário inválido' });
  }

  try {
    const favoritos = await socialService.getFavoritesUserService(usuarioIdNum);
    return res.status(200).json(favoritos);
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    return res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
};
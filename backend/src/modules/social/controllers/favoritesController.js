import * as socialService from "../services/favoritesService.js";

// =========================
// TOGGLE FAVORITE - Add or remove favorite
// Uses JWT token for authentication
// =========================
export const toggleFavorites = async (req, res) => {
  const usuarioId = req.user.id; // From JWT token, not from URL!
  const { personagem_id } = req.params;

  try {
    const result = await socialService.toggleFavoritesService(
      Number(usuarioId),
      Number(personagem_id)
    );

    return res.status(result.status).json(result);

  } catch (err) {
    console.error("Error favoriting:", err);

    return res.status(500).json({
      error: "Error toggling favorite"
    });
  }
};

// =========================
// GET USER FAVORITES - Retrieve user's favorite list (public, read-only)
// =========================
export const getFavoritesUser = async (req, res) => {
  
  const idParam = req.params.usuarioId || req.params.usuario_id;
  const usuarioIdNum = Number(idParam);

  // SAFETY CHECK TO AVOID SENDING INVALID DATA TO THE DATABASE 
  if (!idParam || isNaN(usuarioIdNum)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const favoritos = await socialService.getFavoritesUserService(usuarioIdNum);
    return res.status(200).json(favoritos);
  } catch (error) {
    console.error('Error searching for favorites:', error);
    return res.status(500).json({ error: 'Error searching for favorites' });
  }
};
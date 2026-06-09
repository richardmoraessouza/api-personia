import * as likeService from '../services/likeService.js';
import { updateTagScore } from '../../discovery/repositories/discoveryRepository.js';

// Toggle like for a character by a user
export const toggleLike = async (req, res) => {
  const usuarioId = req.user.id; // From JWT token
  const { personagem_id } = req.params;

  try {
    const resp = await likeService.toggleLikeService(usuarioId, personagem_id);

    // 🔥 CORREÇÃO: Só atualiza o score se 'resp.liked' for true (ou seja, o usuário deu like)
    // Se for false, significa que ele deu "unlike", então não damos pontos.
    if (resp && resp.liked) {
      console.log(`❤️ Like adicionado! Computando pontos para o usuário ${usuarioId}...`);
      await updateTagScore(usuarioId, personagem_id, 'like');
    }

    return res.status(resp.status).json({ liked: resp.liked, message: resp.message });
  } catch (err) {
    console.error('Erro no toggleLike:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

export const toggleFavorites = async (req, res) => {
  const usuarioId = req.user.id;
  const { personagem_id } = req.params;

  try {
    const result = await socialService.toggleFavoritesService(
      Number(usuarioId),
      Number(personagem_id)
    );

    if (result && (result.favorited || result.status === 201 || result.added)) {
      console.log(`⭐ Favorito adicionado! Computando peso pesado para o usuário ${usuarioId}...`);
      await updateTagScore(usuarioId, personagem_id, 'favorite');
    }

    return res.status(result.status).json(result);

  } catch (err) {
    console.error("Error favoriting:", err);
    return res.status(500).json({
      error: "Error toggling favorite"
    });
  }
};

// Get total likes for a character (no authentication, anyone can see)
export const getLikesCount = async (req, res) => {
  const { personagem_id } = req.params;

  try {
    const total = await likeService.getLikesCountService(personagem_id);
    return res.status(200).json({ personagem_id, likes: total });
  } catch (err) {
    console.error('Erro getLikesCount:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Search for all characters liked by a user
export const getLikesByUsuario = async (req, res) => {
  const usuarioId = req.user.id; // ✅ Do JWT token - só lista seus próprios likes
  
  try {
    const ids = await likeService.getLikesByUserService(usuarioId);
    return res.status(200).json(ids);
  } catch (err) {
    console.error('Erro getLikesByUsuario:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
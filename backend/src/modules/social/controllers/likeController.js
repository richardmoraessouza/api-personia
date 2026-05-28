import * as likeService from '../services/likeService.js';

// ✅ CORRIGIDO - Toggle like for a character by a user
export const toggleLike = async (req, res) => {
  const usuarioId = req.user.id; // ✅ Do JWT token, não da URL!
  const { personagem_id } = req.params;

  try {
    const resp = await likeService.toggleLikeService(usuarioId, personagem_id);
    return res.status(resp.status).json({ liked: resp.liked, message: resp.message });
  } catch (err) {
    console.error('Erro no toggleLike:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// Search for total likes of a character (sem autenticação, qualquer um pode ver)
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

// ✅ CORRIGIDO - Search for all characters liked by a user
export const getLikesByUsuario = async (req, res) => {
  const usuarioId = req.user.id; // ✅ Do JWT token - só lista seus próprios likes
  
  try {
    const ids = await likeService.getLikesByUsuarioService(usuarioId);
    return res.status(200).json(ids);
  } catch (err) {
    console.error('Erro getLikesByUsuario:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
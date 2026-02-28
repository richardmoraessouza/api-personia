import db from '../../db/db.js';

// minimal cache for favoritos
const CACHE_TTL = 60 * 1000;
const favCache = {
  byUsuario: new Map(),     // key usuarioId -> [personagems]
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

function clearFavCache(usuarioId) {
  if (usuarioId) favCache.byUsuario.delete(usuarioId);
}

export const favoritos = async (req, res) => {
    const { usuario_id, personagem_id } = req.params;

    // invalidate user cache immediately
    clearFavCache(usuario_id);

    try {
        const result = await db.query(
            `SELECT * FROM personia2.favoritos WHERE usuario_id = $1 AND personagem_id = $2`, 
            [usuario_id, personagem_id]
        );
        
        if (result.rows.length > 0) {
            // Se já existe, remove
            await db.query(
                `DELETE FROM personia2.favoritos WHERE usuario_id = $1 AND personagem_id = $2`, 
                [usuario_id, personagem_id]
            );
            return res.status(200).json({ favorited: false, message: "Favorito removido" });
        } 

        // Se não existe, adiciona
        await db.query(
            `INSERT INTO personia2.favoritos (usuario_id, personagem_id) VALUES ($1, $2)`, 
            [usuario_id, personagem_id]
        );

        return res.status(201).json({ favorited: true, message: "Favorito adicionado" });

    } catch (error) {
        console.error("Error in favoritos:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// 
export const getFavoritosFull = async (req, res) => {
    const { usuarioId } = req.params;

    const cached = getCache(favCache.byUsuario, usuarioId);
    if (cached) {
        return res.status(200).json(cached);
    }
  
    try {
      const query = `
        SELECT p.id, p.nome, p.fotoia, p.descricao, p.usuario_id
        FROM personia2.personagens p
        INNER JOIN personia2.favoritos f ON f.personagem_id = p.id
        WHERE f.usuario_id = $1
        ORDER BY p.nome
      `;
      const result = await db.query(query, [usuarioId]);
      setCache(favCache.byUsuario, usuarioId, result.rows);
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Erro em getFavoritosFull:', error);
      return res.status(500).json({ error: 'Erro ao buscar detalhes dos favoritos' });
    }
  };
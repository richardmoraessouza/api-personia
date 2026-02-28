import db from '../../db/db.js';


const CACHE_TTL = 60 * 1000; 
const likeCache = {
  countByPersonagem: new Map(), 
  byUsuario: new Map(),        
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

function clearLikeCaches(personagemId, usuarioId) {
  if (personagemId) likeCache.countByPersonagem.delete(personagemId);
  if (usuarioId) likeCache.byUsuario.delete(usuarioId);
}

export const toggleLike = async (req, res) => {
    const { usuario_id, personagem_id } = req.params;

    clearLikeCaches(personagem_id, usuario_id);

    try {
        // 1. Verifica se o like já existe
        const exists = await db.query(
            `SELECT * FROM personia2.likes WHERE usuario_id = $1 AND personagem_id = $2`,
            [usuario_id, personagem_id]
        );

        if (exists.rows.length > 0) {
            // 2. Se existe, REMOVE
            await db.query(
                `DELETE FROM personia2.likes WHERE usuario_id = $1 AND personagem_id = $2`,
                [usuario_id, personagem_id]
            );
            return res.status(200).json({ liked: false, message: "Like removido" });
        } else {
            // 3. Se não existe, INSERE
            await db.query(
                `INSERT INTO personia2.likes (usuario_id, personagem_id) VALUES ($1, $2)`,
                [usuario_id, personagem_id]
            );
            return res.status(201).json({ liked: true, message: "Like adicionado" });
        }
    } catch (error) {
        console.error("Erro no toggleLike:", error);
        return res.status(500).json({ error: "Erro interno" });
    }
};

// Contar quantos likes existem para esse personagem (cacheable)
export const getLikes = async (req, res) => {
    const { personagem_id } = req.params;

    const cached = getCache(likeCache.countByPersonagem, personagem_id);
    if (cached != null) {
        return res.status(200).json({ personagem_id, likes: cached });
    }

    try {
        const result = await db.query(
            `SELECT COUNT(*) AS total_likes 
             FROM personia2.likes 
             WHERE personagem_id = $1`,
            [personagem_id]
        );

        const totalLikes = parseInt(result.rows[0].total_likes, 10);
        setCache(likeCache.countByPersonagem, personagem_id, totalLikes);
        return res.status(200).json({ personagem_id, likes: totalLikes });
    } catch (error) {
        console.error("Error in http://localhost:3000getLikes:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Listar os likes de um usuário (cacheable)
export const getLikesByUsuario = async (req, res) => {
    const { usuario_id } = req.params;

    const cached = getCache(likeCache.byUsuario, usuario_id);
    if (cached) {
        return res.status(200).json(cached);
    }
    try {
        const result = await db.query(
            `SELECT personagem_id FROM personia2.likes WHERE usuario_id = $1`,
            [usuario_id]
        );
        const idsCurtidos = result.rows.map(row => row.personagem_id);
        setCache(likeCache.byUsuario, usuario_id, idsCurtidos);
        return res.status(200).json(idsCurtidos);
    } catch (error) {
        console.error("Error in getLikesByUsuario:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

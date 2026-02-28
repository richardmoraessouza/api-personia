import db from '../../db/db.js';

const CACHE_TTL = 60 * 1000; 
const caches = {
  byUsuario: new Map(),      
  byId: new Map(),           
  byNameSearch: new Map(),   
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


// rota para buscar personagem do usuário (com cache)
export const buscar = async (req, res) => {
    const { usuarioId } = req.params;

    const cached = getCache(caches.byUsuario, usuarioId);
    if (cached) {
        return res.status(200).json(cached);
    }

    try {
        const result = await db.query(
            `SELECT id, nome, fotoia, bio, tipo_personagem 
             FROM personia2.personagens 
             WHERE usuario_id = $1`,
            [usuarioId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Personagem não encontrado" });
        }

        setCache(caches.byUsuario, usuarioId, result.rows);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao carregar personagens do usuário', err);
        res.status(500).json({ error: 'Erro ao carregar personagens do usuário', details: err.message });
    }
};

// Buscar personagem pelo ID do personagem (com cache)
export const dadosPersonagem = async (req, res) => {
    const { id } = req.params;

    const cached = getCache(caches.byId, id);
    if (cached) {
        return res.json({ success: true, personagem: cached });
    }

    try {
        const result = await db.query(
            `SELECT * FROM personia2.personagens WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Personagem não encontrado." });
        }

        setCache(caches.byId, id, result.rows[0]);
        res.json({
            success: true,
            personagem: result.rows[0]
        });

    } catch (err) {
        console.error("Erro ao buscar o personagem:", err);
        res.status(500).json({ success: false, error: "Erro interno ao buscar personagem." });
    }
};

// Busca o personagem pelo nome que usuário colocou na busca
export const buscarPersonagem = async (req, res) => {
    const { nomePersonagem } = req.query;

    if (!nomePersonagem) {
        return res.status(400).json({ success: false, error: "O parâmetro nomePersonagem é obrigatório." });
    }

    const lowerTerm = nomePersonagem.toLowerCase();
    const cached = getCache(caches.byNameSearch, lowerTerm);
    if (cached) {
        return res.status(200).json({ success: true, resultados: cached });
    }

    try {
        // O % em volta do termo significa "qualquer coisa antes ou depois"
        const termoBusca = `%${lowerTerm}%`;

        const result = await db.query(
            `SELECT id, nome, fotoia, bio, tipo_personagem 
             FROM personia2.personagens 
             WHERE LOWER(nome) LIKE $1`, 
            [termoBusca]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Nenhum personagem encontrado com esse nome." 
            });
        }

        setCache(caches.byNameSearch, lowerTerm, result.rows);
        res.status(200).json({
            success: true,
            resultados: result.rows
        });

    } catch (err) {
        console.error("Erro ao buscar personagem:", err);
        res.status(500).json({ 
            success: false, 
            error: "Erro interno ao buscar personagem." 
        });
    }
};

// helper to clear caches when data changes (create/update/delete)
export function clearPersonCaches() {
  caches.byUsuario.clear();
  caches.byId.clear();
  caches.byNameSearch.clear();
}

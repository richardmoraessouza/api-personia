import db from '../../db/db.js';
import { clearPersonCaches } from './buscar_person_User.controller.js';

// simple read‑through cache for full list of characters (paginated)
const listCache = new Map(); // key = page:limit
const CACHE_TTL = 60 * 1000; // keep pages for a minute
function setListCache(key, value) {
  listCache.set(key, { value, expires: Date.now() + CACHE_TTL });
}
function getListCache(key) {
  const entry = listCache.get(key);
  if (!entry) return null;
  if (entry.expires < Date.now()) {
    listCache.delete(key);
    return null;
  }
  return entry.value;
}

// rota de criar personagens
export const adicionarPerson = async (req, res) => {
    const { nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, descricao, feitos, obra, tipo_personagem, bio } = req.body;
    const usuarioId = req.user?.id || req.user?.usuarioId;
    console.log("REQ.USER RECEBIDO:", req.user);

    if (!usuarioId) return res.status(401).json({ error: 'Usuário não autenticado' });

    try {

        const result = await db.query(
            `INSERT INTO personia2.personagens 
             (nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, usuario_id, descricao, feitos, obra, tipo_personagem, bio)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             RETURNING *`,
            [

             nome, genero, personalidade, comportamento, estilo, historia, 
             fotoia, regras, usuarioId, descricao, feitos, obra, tipo_personagem, 
             bio

            ]
        );

        // invalidate caches so that subsequent fetches see the new record
        clearPersonCaches();
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar personagem:', err);
        res.status(500).json({ error: 'Erro ao adicionar personagem', details: err.message });
    }
};

// rota de mostrar os personagens (com paginação e cache)
// aceita query params ?page=1&limit=50
export const personagens = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const cacheKey = `${page}:${limit}`;

    const cached = getListCache(cacheKey);
    if (cached) {
        return res.status(200).json(cached);
    }

    try {
        const result = await db.query(
          'SELECT id, nome, fotoia, tipo_personagem, usuario_id, bio FROM personia2.personagens ORDER BY id LIMIT $1 OFFSET $2',
          [limit, offset]
        );
        setListCache(cacheKey, result.rows);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar personagens completo:', err);
        res.status(500).json({ error: 'Erro ao buscar personagens', details: err.message || err });
    }
};

// rota de mostrar personagem pelo idfigurinhas TEXT[] DEFAULT '{}'
export const IdPersonagem = async (req, res) => {
    const { id } = req.params;

    // try to reuse global cache from buscar/controller if available
    // import cache from buscar_person_User.controller.js would create circular
    // so we simply perform a fast query; index on id makes it cheap
    try {
        const result = await db.query(
            'SELECT id, nome, fotoia, descricao, usuario_id FROM personia2.personagens WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Personagem não encontrado' });
        }

        res.status(200).json(result.rows[0]); 
    } catch (err) {
        console.error('Erro ao buscar personagem:', err);
        return res.status(500).json({ error: 'Erro ao buscar personagem', details: err.message });
    }
};
import db from '../../../config/db.js';
import redisClient from '../../../config/redis.js';
import { nanoid } from 'nanoid';
import { handleAutoClassification } from '../../ratings/services/ratingsService.js';


// Get characters by user ID (FRONTEND-FACING: includes internal id for UI interactions)
export const getCharactersByUsuarioId = async (usuarioId) => {
  const result = await db.query(`
    SELECT id, public_id, nome, fotoia, bio, tipo_personagem, usuario_id, descricao
    FROM personia2.personagens
    WHERE usuario_id = $1
  `, [usuarioId]);

  return result.rows;
};

// Get character data by ID (USO INTERNO — joins, jobs, reclassificação)
// Não expor o resultado bruto disso pro frontend.
export const findDataCharacterById = async (id) => {
  const result = await db.query(`
    SELECT * FROM personia2.personagens
    WHERE id = $1
  `, [id]);

  return result.rows[0] || null;
};

// Get character data by public_id (FRONTEND-FACING: use esta em rotas públicas)
export const findDataCharacterByPublicId = async (publicId) => {
  const result = await db.query(`
    SELECT * FROM personia2.personagens
    WHERE public_id = $1
  `, [publicId]);

  const row = result.rows[0];
  if (!row) return null;

  // remove o id interno antes de devolver pro controller/frontend
  const { id, ...publicSafe } = row;
  return publicSafe;
};

// Search characters by name and optionally filter by tag slug (FRONTEND-FACING)
export const searchCharactersByNameAndTag = async (nomePersonagem, tagSlug = '', limit = 20, offset = 0) => {
  const lowerTerm = `%${nomePersonagem.toLowerCase()}%`;

  if (!tagSlug) {
    const result = await db.query(`
      SELECT id, public_id, nome, fotoia, bio, tipo_personagem, usuario_id, descricao, tags_slugs AS tags
      FROM personia2.personagens
      WHERE LOWER(nome) LIKE $1
      ORDER BY id
      LIMIT $2 OFFSET $3
    `, [lowerTerm, limit, offset]);
    return result.rows;
  }

  const result = await db.query(`
    SELECT id, public_id, nome, fotoia, bio, tipo_personagem, usuario_id, descricao, tags_slugs AS tags
    FROM personia2.personagens
    WHERE LOWER(nome) LIKE $1
      AND $2 = ANY(tags_slugs)
    ORDER BY id
    LIMIT $3 OFFSET $4
  `, [lowerTerm, tagSlug, limit, offset]);

  return result.rows;
};

// Update character by ID and re-run AI classification (USO INTERNO)
// OBS: o controller que chama isso deve resolver public_id -> id ANTES de chamar esta função.
export const updateCharacterById = async (id, person) => {
  const {
    nome, bio, genero, personalidade, historia, fotoia, regras, 
    descricao, obra, tipo_personagem, conversation_style, 
    aparencia, gostos, desgostos, objetivos, primeiramensagem, 
    relacaousuario, cenario, quick_prompt, is_modo_rapido
  } = person;

  const query = `
    UPDATE personia2.personagens
    SET
      nome = $1, bio = $2, genero = $3, personalidade = $4,
      historia = $5, fotoia = $6, regras = $7, descricao = $8,
      obra = $9, tipo_personagem = $10, conversation_style = $11,
      aparencia = $12, gostos = $13, desgostos = $14, objetivos = $15,
      primeiramensagem = $16, relacaousuario = $17, cenario = $18, quick_prompt = $19, is_modo_rapido = $20
    WHERE id = $21
    RETURNING *
  `;

  const values = [
    nome ?? null, bio ?? null, genero ?? null, personalidade ?? null,
    historia ?? null, fotoia ?? null, regras ?? null, descricao ?? null,
    obra ?? null, tipo_personagem ?? null, conversation_style ?? null,
    aparencia ?? null, gostos ?? null, desgostos ?? null, objetivos ?? null,
    primeiramensagem ?? null, relacaousuario ?? null, cenario ?? null, quick_prompt ?? null, is_modo_rapido ?? null, id
  ];

  const result = await db.query(query, values);
  const updatedCharacter = result.rows[0];

  // --- RECLASSIFICAÇÃO AUTOMÁTICA ---
  if (updatedCharacter && updatedCharacter.id) {
    console.log(`[IA Autônoma] Detectada atualização no bot "${nome}". Reclassificando tags...`);
    
    handleAutoClassification(updatedCharacter.id, updatedCharacter)
      .then(tagsIds => {
        console.log(`[IA Autônoma] Bot "${nome}" reclassificado.`);
      })
      .catch(err => {
        console.error("[IA Autônoma] Falha na reclassificação:", err.message);
      });
  }

  return updatedCharacter;
};

// Create new character
export const createCharacter = async (person) => {
  // Desestruturando todos os campos novos do objeto 'person'
  const {
    nome, genero, personalidade, historia, fotoia, regras, 
    usuario_id, usuarioId, descricao, obra, bio, 
    conversation_style, aparencia, gostos, desgostos, 
    objetivos, primeiramensagem, relacaousuario, cenario, tipo_personagem, quick_prompt, is_modo_rapido
  } = person;
  
  const userId = usuario_id || usuarioId;
  const publicId = nanoid();

  const query = `
    INSERT INTO personia2.personagens 
    (
      nome, genero, personalidade, historia, fotoia, regras, usuario_id, 
      descricao, obra, bio, conversation_style, aparencia, gostos, 
      desgostos, objetivos, primeiramensagem, relacaousuario, cenario, tipo_personagem, quick_prompt, is_modo_rapido, public_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *
  `;

  const values = [
    nome, genero, personalidade, historia, fotoia, regras, userId, 
    descricao, obra, bio, conversation_style, aparencia, gostos, 
    desgostos, objetivos, primeiramensagem, relacaousuario, cenario, tipo_personagem, quick_prompt, is_modo_rapido, publicId
  ];

  const result = await db.query(query, values);
  const newCharacter = result.rows[0];

  if (newCharacter && newCharacter.id) {
    handleAutoClassification(newCharacter.id, person)
      .catch(err => console.error("[IA Autônoma] Falha:", err.message));
  }

  return newCharacter;
};

// Save recent character interaction - keeps only last 10 per user (USO INTERNO, recebe id interno)
export const saveRecentCharacter = async (usuarioId, personagemId) => {
  // 1. Insere ou atualiza o personagem atual
  const insertQuery = `
     INSERT INTO personia2.recent_characters (usuario_id, personagem_id, criado_em)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (usuario_id, personagem_id) 
     DO UPDATE SET criado_em = EXCLUDED.criado_em;
  `;
  
  // 2. Apaga os registros mais velhos baseando-se estritamente na data (criado_em)
  const deleteQuery = `
     DELETE FROM personia2.recent_characters
     WHERE usuario_id = $1
       AND criado_em NOT IN (
           SELECT criado_em 
           FROM personia2.recent_characters 
           WHERE usuario_id = $1
           ORDER BY criado_em DESC 
           LIMIT 10
       );
  `;

  // Execute insert and delete in sequence
  await db.query(insertQuery, [usuarioId, personagemId]);
  await db.query(deleteQuery, [usuarioId]);

  return { success: true };
};

// Get 10 most recent characters for user (FRONTEND-FACING: includes internal id for UI interactions)
export const findRecentCharacters = async (usuarioId) => {
  const query = `
    SELECT p.id, p.public_id, p.nome, p.fotoia, p.tipo_personagem, p.usuario_id, p.bio, p.descricao
    FROM (
        SELECT DISTINCT ON (personagem_id) personagem_id, criado_em
        FROM personia2.recent_characters
        WHERE usuario_id = $1
        ORDER BY personagem_id, criado_em DESC
    ) rc
    JOIN personia2.personagens p ON p.id = rc.personagem_id
    ORDER BY rc.criado_em DESC
    LIMIT 20
  `;
  
  const result = await db.query(query, [usuarioId]);
  return result.rows;
};

//single view function (USO INTERNO, recebe id interno resolvido pelo controller)
export const registerViewHistory = async (userId, characterId) => {
  const query = `
    INSERT INTO personia2.character_views_history (user_id, character_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, character_id) DO NOTHING;
  `;
  const result = await db.query(query, [userId, characterId]); 
  return result.rowCount; // Returns 1 if first access, 0 if user already viewed
};

// Increment views column in main character table (USO INTERNO, recebe id interno)
export const incrementViews = async (characterId) => {
  // Incremento total
  await db.query(`UPDATE personia2.personagens SET visualizacoes = visualizacoes + 1 WHERE id = $1`, [characterId]);
  
  // Incremento semanal (Performance otimizada)
  await db.query(`
    INSERT INTO personia2.weekly_views (personagem_id, view_count)
    VALUES ($1, 1)
    ON CONFLICT (personagem_id) 
    DO UPDATE SET view_count = personia2.weekly_views.view_count + 1
  `, [characterId]);
};

//search for the 10 most popular characters of the week based on recent views. (FRONTEND-FACING)
export const getPopularWeekCharacters = async () => {
  const query = `
    SELECT p.public_id, p.nome, p.fotoia, p.tipo_personagem, p.usuario_id, p.bio, p.descricao, wv.view_count
    FROM personia2.personagens p
    JOIN personia2.weekly_views wv ON p.id = wv.personagem_id
    WHERE p.fotoia IS NOT NULL 
      AND p.fotoia <> '/semPerfil.jpg'
    ORDER BY wv.view_count DESC
    LIMIT 10
  `;
  const result = await db.query(query);
  return result.rows;
};

// FRONTEND-FACING: sem id interno na resposta.
// OBS: o WHERE id NOT IN continua usando o id interno (é filtro/join, não vaza pro cliente).
export const getCharactersPaginated = async (limit, offset, seed = 0.5, popularIds = []) => {
  const cacheKey = `explore:${limit}:${offset}:${seed}:${popularIds.join(',')}`;

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const hasValidIds = Array.isArray(parsed) && parsed.every(item => item && typeof item.id === 'number');
      if (hasValidIds) {
        return parsed;
      }
      console.warn(`[Cache WARN] Invalid cached explore data detected for ${cacheKey}; refreshing cache.`);
    }
  } catch (cacheErr) {
    console.warn(`[Cache ERROR] Failed to get ${cacheKey}:`, cacheErr.message);
  }

  const excludeIds = popularIds.length > 0 ? popularIds : [0];

  const query = `
    SELECT id, public_id, nome, fotoia, tipo_personagem, usuario_id, bio, descricao, visualizacoes, criado_em
    FROM personia2.personagens
    WHERE id NOT IN (${excludeIds.join(',')})
    ORDER BY visualizacoes DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await db.query(query, [limit, offset]);
  const data = result.rows;

  try {
    await redisClient.setEx(cacheKey, 300, JSON.stringify(data));
  } catch (cacheErr) {
    console.warn(`[Cache ERROR] Failed to set ${cacheKey}:`, cacheErr.message);
  }

  return data;
};

// ============ ROUTE HANDLERS (Express middleware) ============

// GET /user-search-by-id/:usuarioId
export const search = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const characters = await getCharactersByUsuarioId(usuarioId);
    res.json(characters);
  } catch (error) {
    console.error('Error in search handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /search-character
export const getSearchCharacter = async (req, res) => {
  try {
    const { nomePersonagem, q, tag, limit = 20, offset = 0 } = req.query;
    const searchTerm = (nomePersonagem || q)?.toString().trim();
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const characters = await searchCharactersByNameAndTag(searchTerm, tag || '', parseInt(limit), parseInt(offset));
    res.json(characters);
  } catch (error) {
    console.error('Error in getSearchCharacter handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /explore
export const getExploreCharacters = async (req, res) => {
  try {
    const { limit = 20, offset = 0, seed = 0.5, popularIds = '' } = req.query;
    const popularIdsList = popularIds ? popularIds.split(',').map(Number) : [];
    const characters = await getCharactersPaginated(parseInt(limit), parseInt(offset), parseFloat(seed), popularIdsList);
    res.json(characters);
  } catch (error) {
    console.error('Error in getExploreCharacters handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /data-character-by-id/:id
export const getDataCharacter = async (req, res) => {
  try {
    const { id } = req.params;
    const character = await findDataCharacterById(id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json(character);
  } catch (error) {
    console.error('Error in getDataCharacter handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /data-character-by-public-id/:publicId
export const getDataCharacterByPublicId = async (req, res) => {
  try {
    const { publicId } = req.params;
    const character = await findDataCharacterByPublicId(publicId);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json(character);
  } catch (error) {
    console.error('Error in getDataCharacterByPublicId handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resolveCharacterId = async (identifier) => {
  if (identifier === undefined || identifier === null || identifier === '') {
    return null;
  }

  const numericId = Number(identifier);
  if (!Number.isNaN(numericId) && String(numericId) === String(identifier)) {
    const character = await findDataCharacterById(numericId);
    if (character) {
      return numericId;
    }
  }

  const result = await db.query(
    'SELECT id FROM personia2.personagens WHERE public_id = $1',
    [identifier]
  );

  return result.rows[0]?.id || null;
};

// PUT /update-character/:id
export const updateCharacter = async (req, res) => {
  try {
    const { id } = req.params;
    const characterData = req.body;
    const updatedCharacter = await updateCharacterById(id, characterData);
    if (!updatedCharacter) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json(updatedCharacter);
  } catch (error) {
    console.error('Error in updateCharacter handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /create-character/:usuarioId
export const createCharacterHandler = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const characterData = { ...req.body, usuario_id: usuarioId };
    const newCharacter = await createCharacter(characterData);
    res.status(201).json(newCharacter);
  } catch (error) {
    console.error('Error in createCharacterHandler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /recent-characters/:usuarioId/:personagemId
export const handleSaveRecentCharacter = async (req, res) => {
  try {
    const { usuarioId, personagemId } = req.params;
    const resolvedId = await resolveCharacterId(personagemId);
    if (!resolvedId) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const result = await saveRecentCharacter(usuarioId, resolvedId);
    res.json(result);
  } catch (error) {
    console.error('Error in handleSaveRecentCharacter handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /get-recent-characters/:usuarioId
export const handleGetRecentCharacters = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const characters = await findRecentCharacters(usuarioId);
    res.json(characters);
  } catch (error) {
    console.error('Error in handleGetRecentCharacters handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /character-views/:id
export const getCharacterProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const character = await findDataCharacterById(id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    // Return character profile with view count
    res.json({
      ...character,
      views: character.visualizacoes || 0
    });
  } catch (error) {
    console.error('Error in getCharacterProfile handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /increment-chat-views/:id
export const countCharacterView = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body?.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get character to verify it exists and resolve public_id if needed
    const character = await findDataCharacterById(id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Register view in history and increment views
    await registerViewHistory(userId, id);
    await incrementViews(id);

    res.json({ success: true, views: (character.visualizacoes || 0) + 1 });
  } catch (error) {
    console.error('Error in countCharacterView handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /increment-chat-views-public/:publicId
export const countCharacterViewByPublicId = async (req, res) => {
  try {
    const { publicId } = req.params;
    const userId = req.user?.id || req.body?.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get character by public_id to find internal id
    const character = await findDataCharacterByPublicId(publicId);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // We need the internal ID to register views. Get it
    const result = await db.query('SELECT id FROM personia2.personagens WHERE public_id = $1', [publicId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }
    const internalId = result.rows[0].id;

    // Register view in history and increment views
    await registerViewHistory(userId, internalId);
    await incrementViews(internalId);

    res.json({ success: true, views: (character.visualizacoes || 0) + 1 });
  } catch (error) {
    console.error('Error in countCharacterViewByPublicId handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
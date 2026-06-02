import db from '../../../config/db.js';
import redisClient from '../../../config/redis.js';

// Get characters by user ID
export const getCharactersByUsuarioId = async (usuarioId) => {
  const result = await db.query(`
    SELECT id, nome, fotoia, bio, tipo_personagem, usuario_id, descricao
    FROM personia2.personagens
    WHERE usuario_id = $1
  `, [usuarioId]);

  return result.rows;
};

// Get character data by ID
export const findDataCharacterById = async (id) => {
  const result = await db.query(`
    SELECT * FROM personia2.personagens
    WHERE id = $1
  `, [id]);

  return result.rows[0] || null;
};

// Search characters by name
export const searchCharactersByName = async (nomePersonagem) => {
  const lowerTerm = `%${nomePersonagem.toLowerCase()}%`;
  const result = await db.query(`
    SELECT id, nome, fotoia, bio, tipo_personagem, usuario_id, descricao
    FROM personia2.personagens
    WHERE LOWER(nome) LIKE $1
  `, [lowerTerm]);

  return result.rows;
};

// Update character by ID
export const updateCharacterById = async (id, person) => {
  const {
    nome,
    bio,
    genero,
    personalidade,
    comportamento,
    estilo,
    historia,
    fotoia,
    regras,
    descricao,
    obra,
    tipo_personagem,
    figurinhas
  } = person;

  const query = `
    UPDATE personia2.personagens
    SET
      nome = $1,
      bio = $2,
      genero = $3,
      personalidade = $4,
      comportamento = $5,
      estilo = $6,
      historia = $7,
      fotoia = $8,
      regras = $9,
      descricao = $10,
      obra = $11,
      tipo_personagem = $12,
      figurinhas = $13
    WHERE id = $14
    RETURNING *
  `;

  const values = [
    nome ?? null,
    bio ?? null,
    genero ?? null,
    personalidade ?? null,
    comportamento ?? null,
    estilo ?? null,
    historia ?? null,
    fotoia ?? null,
    regras ?? null,
    descricao ?? null,
    obra ?? null,
    tipo_personagem ?? null,
    figurinhas ?? null,
    id
  ];

  const result = await db.query(query, values);

  return result.rows[0] || null;
};

// Create new character
export const createCharacter = async (person) => {
  const {
    nome,
    genero,
    personalidade,
    comportamento,
    estilo,
    historia,
    fotoia,
    regras,
    usuario_id,
    usuarioId,
    descricao,
    obra,
    tipo_personagem,
    bio
  } = person;

  const userId = usuario_id || usuarioId;

  const result = await db.query(
    `INSERT INTO personia2.personagens 
     (nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, usuario_id, descricao, obra, tipo_personagem, bio)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      nome,
      genero,
      personalidade,
      comportamento,
      estilo,
      historia,
      fotoia,
      regras,
      userId,
      descricao,
      obra,
      tipo_personagem,
      bio
    ]
  );

  return result.rows[0];
}

// Save recent character interaction - keeps only last 10 per user
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

// Get 10 most recent characters for user
export const findRecentCharacters = async (usuarioId) => {
  const query = `
    SELECT p.id, p.nome, p.fotoia, p.tipo_personagem, p.usuario_id, p.bio, p.descricao
    FROM (
        SELECT DISTINCT ON (personagem_id) personagem_id, criado_em
        FROM personia2.recent_characters
        WHERE usuario_id = $1
        ORDER BY personagem_id, criado_em DESC
    ) rc
    JOIN personia2.personagens p ON p.id = rc.personagem_id
    ORDER BY rc.criado_em DESC
    LIMIT 10
  `;
  
  const result = await db.query(query, [usuarioId]);
  return result.rows;
};

//single view function
export const registerViewHistory = async (userId, characterId) => {
  const query = `
    INSERT INTO personia2.character_views_history (user_id, character_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, character_id) DO NOTHING;
  `;
  const result = await db.query(query, [userId, characterId]); 
  return result.rowCount; // Returns 1 if first access, 0 if user already viewed
};

// Increment views column in main character table
export const incrementViews = async (characterId) => {
  const query = `
    UPDATE personia2.personagens 
    SET visualizacoes = visualizacoes + 1 
    WHERE id = $1;
  `;
  await db.query(query, [characterId]);
};

//search for the 10 most popular characters of the week based on recent views.
export const getPopularWeekCharacters = async () => {
  const query = `
    SELECT id, nome, fotoia, tipo_personagem, usuario_id, bio, descricao, visualizacoes
    FROM personia2.personagens
    WHERE fotoia IS NOT NULL 
      AND fotoia <> '/semPerfil.jpg'
      AND bio IS NOT NULL
      AND criado_em >= NOW() - INTERVAL '7 days'
    ORDER BY visualizacoes DESC, criado_em DESC
    LIMIT 10
  `;
  
  const result = await db.query(query);
  return result.rows;
};

// Search characters for the Explore tab in a paginated and divided way (Half Popular / Half New).
// Filter and ignore IDs passed in the array to avoid duplication with the top of the site.
export const getCharactersPaginated = async (limit, offset, seed = 0.5, popularIds = []) => {
  // Create a unique cache key based on the parameters
  const cacheKey = `explore:${limit}:${offset}:${seed}:${popularIds.join(',')}`;

  try {
    // Try to get from Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (cacheErr) {
    console.warn(`[Cache ERROR] Failed to get ${cacheKey}:`, cacheErr.message);
    // Continue with database query if cache fails
  }

  // Divide the total limit by 2 to bring equal slices of content
  const halfLimit = Math.floor(limit / 2);
  // Divide the offset by 2 to advance the pages proportionally in the two subqueries
  const halfOffset = Math.floor(offset / 2);

  // Initialize the random seed for Postgres to avoid repeating random cards
  await db.query('SELECT setseed($1)', [seed]);

  // If the array of popular IDs is empty, we use [0] to avoid breaking the "NOT IN" syntax in SQL
  const excludeIds = popularIds.length > 0 ? popularIds : [0];

  const query = `
    (
      /* --- PRIMEIRA METADE: Os mais populares gerais do sistema (excluindo os da semana) --- */
      SELECT id, nome, fotoia, tipo_personagem, usuario_id, bio, descricao, visualizacoes, criado_em
      FROM personia2.personagens
      WHERE fotoia IS NOT NULL 
        AND fotoia <> '/semPerfil.jpg'
        AND bio IS NOT NULL
        AND criado_em < NOW() - INTERVAL '7 days'
        AND id NOT IN (${excludeIds.join(',')}) -- Bloqueia os IDs do carrossel
      ORDER BY visualizacoes DESC, criado_em DESC
      LIMIT $1 OFFSET $2
    )
    UNION ALL
    (
      /* --- SEGUNDA METADE: Novidades REAIS misturadas com aleatoriedade --- */
      SELECT id, nome, fotoia, tipo_personagem, usuario_id, bio, descricao, visualizacoes, criado_em
      FROM personia2.personagens
      WHERE fotoia IS NOT NULL 
        AND fotoia <> '/semPerfil.jpg'
        AND bio IS NOT NULL
        AND id NOT IN (${excludeIds.join(',')}) -- Bloqueia os IDs do carrossel aqui também
      -- Prioriza personagens criados nos últimos 3 dias e depois embaralha
      ORDER BY (criado_em >= NOW() - INTERVAL '3 days') DESC, RANDOM()
      LIMIT $1 OFFSET $2
    )
  `;

  const result = await db.query(query, [halfLimit, halfOffset]);
  const data = result.rows;

  // Store in Redis cache with 5 minutes TTL (300 seconds)
  try {
    await redisClient.setEx(cacheKey, 300, JSON.stringify(data));
  } catch (cacheErr) {
    console.warn(`[Cache ERROR] Failed to set ${cacheKey}:`, cacheErr.message);
    // Don't fail the request if cache write fails
  }

  return data;
};
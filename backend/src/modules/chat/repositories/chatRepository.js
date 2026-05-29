import db from '../../../config/db.js';

const personagemCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 seconds

/**
 * Search character by in database or caching
 */
export async function getPersonagemById(id) {
  const now = Date.now();

  // Check cache
  if (personagemCache[id]) {
    const cached = personagemCache[id];
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    delete personagemCache[id];
  }

  // Search in database
  const result = await db.query(
    `SELECT 
       id, nome, obra, genero, personalidade, comportamento, 
       estilo, historia, regras, tipo_personagem, fotoia, bio
     FROM personia2.personagens 
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;

  const personagem = result.rows[0];

  // Armazena no cache
  personagemCache[id] = {
    data: personagem,
    timestamp: now
  };

  return personagem;
}

/**
 * Find or create user conversation with character
 */
export async function getConversaHistorico(usuarioId, personagemId) {
  const result = await db.query(
    `SELECT historico
     FROM personia2.conversas
     WHERE usuario_id = $1 AND personagem_id = $2`,
    [usuarioId, personagemId]
  );

  if (result.rows.length === 0) {
    return [];
  }

  return result.rows[0].historico || [];
}

/**
 * Save conversation history
 */
export async function saveConversaHistorico(usuarioId, personagemId, historico) {
  const result = await db.query(
    `INSERT INTO personia2.conversas (usuario_id, personagem_id, historico)
     VALUES ($1, $2, $3)
     ON CONFLICT (usuario_id, personagem_id)
     DO UPDATE SET historico = $3
     RETURNING *`,
    [usuarioId, personagemId, JSON.stringify(historico)]
  );

  return result.rows[0];
}

/**
 * Clear character cache
 */
export function clearPersonagemCache(personagemId) {
  delete personagemCache[personagemId];
}

/**
 * Clear entire cache
 */
export function clearAllCache() {
  Object.keys(personagemCache).forEach(key => delete personagemCache[key]);
}

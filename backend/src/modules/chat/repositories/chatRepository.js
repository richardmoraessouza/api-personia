import db from '../../../config/db.js';

const personagemCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Search character in database or cache
 */
export async function getCharacterById(id) {
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
      id, nome, obra, genero, personalidade,
      historia, regras, tipo_personagem, fotoia, bio,
      descricao, aparencia, gostos, desgostos, objetivos,
      primeiramensagem, relacaousuario, cenario,
      conversation_style, quick_prompt, is_modo_rapido
   FROM personia2.personagens 
   WHERE id = $1`,
  [id]
  );

  if (result.rows.length === 0) return null;

  const personagem = result.rows[0];

  // Store in cache
  personagemCache[id] = {
    data: personagem,
    timestamp: now
  };

  return personagem;
}

/**
 * Get an existing chat ID or create one if it doesn't exist (Idempotent)
 * @param {number} userId - User ID
 * @param {number} characterId - Character ID
 * @returns {Promise<number>} The chat session ID
 */
export const getOrCreateChatId = async (userId, characterId) => {
  const result = await db.query(
    `INSERT INTO personia2.chats (usuario_id, personagem_id)
     VALUES ($1, $2)
     ON CONFLICT (usuario_id, personagem_id) 
     DO UPDATE SET usuario_id = EXCLUDED.usuario_id 
     RETURNING id`,
    [userId, characterId]
  );
  return result.rows[0].id;
};

/**
 * Fetch a paginated chunk of messages from a specific chat session
 * @param {number} chatId - Chat Session ID
 * @param {number} limit - How many messages to fetch (default: 30)
 * @param {number} offset - How many messages to skip for pagination (default: 0)
 * @returns {Promise<Array>} Array of messages ordered chronologically
 */
export const getChatHistory = async (chatId, limit = 30, offset = 0) => {
  const result = await db.query(
    `SELECT id, role, content, is_pinned, reply_to_id
     FROM personia2.messages
     WHERE chat_id = $1
     ORDER BY criado_em DESC
     LIMIT $2 OFFSET $3`,
    [chatId, limit, offset]
  );

  // Still reverse the chunk so it renders from oldest to newest in the UI box
  return result.rows.reverse();
};

/**
 * Insert a single message into the database
 * @param {number} chatId - Chat Session ID
 * @param {string} role - Message author role ('user' or 'model')
 * @param {string} content - Text content of the message
 * @param {number|null} replyToId - Optional ID of the message being replied to
 * @returns {Promise<Object>} The inserted message row
 */
export const saveMessage = async (chatId, role, content, replyToId = null) => {
  const result = await db.query(
    `INSERT INTO personia2.messages (chat_id, role, content, reply_to_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [chatId, role, content, replyToId]
  );

  return result.rows[0];
};

/**
 * Delete a specific message by its ID
 * @param {number} messageId - Message ID to be deleted
 * @returns {Promise<boolean>} Returns true if the message was deleted
 */
export const deleteMessage = async (messageId) => {
  const result = await db.query(
    `DELETE FROM personia2.messages 
     WHERE id = $1`,
    [messageId]
  );
  return result.rowCount > 0;
};

/**
 * Toggle the pinned status of a message
 * @param {number} messageId - Message ID
 * @param {boolean} isPinned - New pinned state (true to pin, false to unpin)
 * @returns {Promise<Object>} The updated message row
 */
export const togglePinMessage = async (messageId, isPinned) => {
  const result = await db.query(
    `UPDATE personia2.messages 
     SET is_pinned = $2
     WHERE id = $1
     RETURNING *`,
    [messageId, isPinned]
  );
  return result.rows[0];
};

/**
 * Fetch all pinned messages from a specific chat session
 * @param {number} chatId - Chat Session ID
 * @returns {Promise<Array>} Array of pinned messages ordered chronologically
 */
export const getPinnedMessages = async (chatId) => {
  const result = await db.query(
    `SELECT id, role, content, criado_em, reply_to_id
     FROM personia2.messages
     WHERE chat_id = $1 AND is_pinned = true
     ORDER BY criado_em ASC`,
    [chatId]
  );
  return result.rows;
};

/**
 * Fetch a specific message by ID to validate it exists and retrieve its details
 * @param {number} messageId - Message ID to retrieve
 * @returns {Promise<Object|null>} The message object or null if not found
 */
export const getMessageById = async (messageId) => {
  const result = await db.query(
    `SELECT id, role, content, reply_to_id, is_pinned, criado_em
     FROM personia2.messages
     WHERE id = $1`,
    [messageId]
  );
  return result.rows[0] || null;
};

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
import db from '../../../config/db.js';
import { createHash } from 'crypto';

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
 * Search character by public_id in database or cache
 */
export async function getCharacterByPublicId(publicId) {
  const now = Date.now();

  // Check cache
  if (personagemCache[publicId]) {
    const cached = personagemCache[publicId];
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    delete personagemCache[publicId];
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
   WHERE public_id = $1`,
  [publicId]
  );

  if (result.rows.length === 0) return null;

  const personagem = result.rows[0];

  // Store in cache
  personagemCache[publicId] = {
    data: personagem,
    timestamp: now
  };

  return personagem;
}

/**
 * Resolve character exclusively by public_id for chat flows.
 * The chat routes should never depend on the internal numeric id.
 */
export async function getCharacterByIdOrPublicId(identifier) {
  if (identifier === undefined || identifier === null || identifier === '') {
    return null;
  }

  const numericId = Number(identifier);
  if (!isNaN(numericId) && String(numericId) === String(identifier)) {
    const characterById = await getCharacterById(numericId);
    if (characterById) {
      return characterById;
    }
  }

  return await getCharacterByPublicId(identifier);
}

export const findOrCreateAnonymousUser = async (anonymousKey) => {
  const key = String(anonymousKey || '').trim();

  if (!key) {
    throw new Error('ANONYMOUS_KEY_REQUIRED');
  }

  const hash = createHash('sha256').update(key).digest('hex');
  const derivedId = 1_000_000_000 + (parseInt(hash.slice(0, 8), 16) % 1_000_000_000);
  const username = `anon_${hash.slice(0, 10)}`;
  const email = `anon_${hash.slice(0, 12)}@anon.local`;

  const insertResult = await db.query(
    `INSERT INTO personia2.usuarios (id, gmail, nome, username)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO NOTHING
     RETURNING id`,
    [derivedId, email, 'Usuário anônimo', username]
  );

  if (insertResult.rows[0]) {
    return insertResult.rows[0].id;
  }

  const existing = await db.query(
    `SELECT id FROM personia2.usuarios WHERE id = $1 LIMIT 1`,
    [derivedId]
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const fallback = await db.query(
    `SELECT id FROM personia2.usuarios WHERE username = $1 LIMIT 1`,
    [username]
  );

  return fallback.rows[0]?.id ?? derivedId;
};

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

  const rows = result.rows.reverse();
  const enriched = [];

  for (const row of rows) {
    const media = await getMessageMedia(row.id);
    enriched.push({
      ...row,
      media,
    });
  }

  return enriched;
};

/**
 * Insert a single message into the database
 * @param {number} chatId - Chat Session ID
 * @param {string} role - Message author role ('user' or 'model')
 * @param {string} content - Text content of the message
 * @param {number|null} replyToId - Optional ID of the message being replied to
 * @returns {Promise<Object>} The inserted message row
 */
export const saveMessage = async (chatId, role, content, replyToId = null, mediaPayload = null) => {
  const result = await db.query(
    `INSERT INTO personia2.messages (chat_id, role, content, reply_to_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [chatId, role, content, replyToId]
  );

  const savedMessage = result.rows[0];

  if (mediaPayload?.mediaData) {
    await createMessageMedia(savedMessage.id, mediaPayload.mediaType || 'audio', mediaPayload.mediaData, mediaPayload.mediaUrl || null);
  }

  return {
    ...savedMessage,
    media: mediaPayload?.mediaData ? [{ media_type: mediaPayload.mediaType || 'audio', media_data: mediaPayload.mediaData, media_url: mediaPayload.mediaUrl || null }] : [],
  };
};

export const createMessageMedia = async (messageId, mediaType = 'audio', mediaData = null, mediaUrl = null) => {
  const result = await db.query(
    `INSERT INTO personia2.message_media (message_id, media_type, media_data, media_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [messageId, mediaType, mediaData, mediaUrl]
  );
  return result.rows[0];
};

export const getMessageMedia = async (messageId) => {
  const result = await db.query(
    `SELECT id, media_type, media_data, media_url, criado_em
     FROM personia2.message_media
     WHERE message_id = $1
     ORDER BY criado_em ASC`,
    [messageId]
  );
  return result.rows;
};

/**
 * Delete a specific message by its ID
 * @param {number} messageId - Message ID to be deleted
 * @returns {Promise<boolean>} Returns true if the message was deleted
 */
export const deleteMessage = async (messageId, userId) => {
  const result = await db.query(
    `DELETE FROM personia2.messages 
     WHERE id = $1
       AND chat_id IN (
         SELECT id FROM personia2.chats WHERE usuario_id = $2
       )`,
    [messageId, userId]
  );
  return result.rowCount > 0;
};

/**
 * Toggle the pinned status of a message
 * @param {number} messageId - Message ID
 * @param {boolean} isPinned - New pinned state (true to pin, false to unpin)
 * @returns {Promise<Object>} The updated message row
 */
export const togglePinMessage = async (messageId, isPinned, userId) => {
  const result = await db.query(
    `UPDATE personia2.messages 
     SET is_pinned = $2
     WHERE id = $1
       AND chat_id IN (
         SELECT id FROM personia2.chats WHERE usuario_id = $3
       )
     RETURNING *`,
    [messageId, isPinned, userId]
  );
  return result.rows[0];
};

/**
 * Fetch all pinned messages from a specific chat session
 * @param {number} chatId - Chat Session ID
 * @returns {Promise<Array>} Array of pinned messages ordered chronologically
 */
export const getPinnedMessages = async (chatId, userId) => {
  const result = await db.query(
    `SELECT id, role, content, criado_em, reply_to_id
     FROM personia2.messages
     WHERE chat_id = $1
       AND is_pinned = true
       AND chat_id IN (
         SELECT id FROM personia2.chats WHERE usuario_id = $2
       )
     ORDER BY criado_em ASC`,
    [chatId, userId]
  );
  return result.rows;
};

/**
 * Fetch a specific message by ID to validate it exists and retrieve its details
 * @param {number} messageId - Message ID to retrieve
 * @returns {Promise<Object|null>} The message object or null if not found
 */
export const getMessageById = async (messageId, userId) => {
  const result = await db.query(
    `SELECT id, role, content, reply_to_id, is_pinned, criado_em
     FROM personia2.messages
     WHERE id = $1
       AND chat_id IN (
         SELECT id FROM personia2.chats WHERE usuario_id = $2
       )`,
    [messageId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Accumulate conversation time for a user+character pair
 * @param {number} userId
 * @param {number} characterId
 * @param {number} seconds
 * @returns {Promise<Object>} Updated row
 */
export const addConversationTime = async (userId, characterId, seconds) => {
  const result = await db.query(
    `INSERT INTO personia2.conversation_time (usuario_id, personagem_id, total_seconds, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (usuario_id, personagem_id)
     DO UPDATE SET
       total_seconds = personia2.conversation_time.total_seconds + EXCLUDED.total_seconds,
       updated_at    = NOW()
     RETURNING *`,
    [userId, characterId, seconds]
  );
  return result.rows[0];
};

/**
 * Get total conversation time for a user+character pair
 * @param {number} userId
 * @param {number} characterId
 * @returns {Promise<Object>} Row with total_seconds or default zero
 */
export const getConversationTime = async (userId, characterId) => {
  const result = await db.query(
    `SELECT total_seconds, updated_at
     FROM personia2.conversation_time
     WHERE usuario_id = $1 AND personagem_id = $2`,
    [userId, characterId]
  );
  return result.rows[0] || { total_seconds: 0 };
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

/**
 * Delete ALL messages from a chat 
 * @param {number} chatId - Chat Session ID
 * @param {number} userId - User ID (garante que só o dono do chat pode limpar)
 * @returns {Promise<number>} Quantidade de mensagens apagadas
 */
export const DeleteclearChatHistory = async (chatId, userId) => {
  // Apaga primeiro as mídias das mensagens desse chat (caso não haja
  // ON DELETE CASCADE configurado na FK de message_media -> messages)
  await db.query(
    `DELETE FROM personia2.message_media
     WHERE message_id IN (
       SELECT id FROM personia2.messages
       WHERE chat_id = $1
         AND chat_id IN (
           SELECT id FROM personia2.chats WHERE usuario_id = $2
         )
     )`,
    [chatId, userId]
  );

  const result = await db.query(
    `DELETE FROM personia2.messages
     WHERE chat_id = $1
       AND chat_id IN (
         SELECT id FROM personia2.chats WHERE usuario_id = $2
       )`,
    [chatId, userId]
  );

  return result.rowCount;
};
import * as chatRepository from '../repositories/chatRepository.js';
import buildPersonPrompt from '../utils/buildPersonPrompt.js';
import { generateContent } from '../utils/geminiClient.js';
import { CHAT_RULES, validateMessage, REPLY_INSTRUCTIONS, REPLY_TAG_REGEX, ID_PREFIX_REGEX, stripLeadingEcho} from '../../../rules/chatRules.js';


/**
 * Formats the system prompt, historical messages, and current input into Gemini payload format
 */
function buildGeminiContents(systemPrompt, userMessage, history) {
  const contents = [];

  contents.push({
    role: 'model',
    parts: [{ text: `${systemPrompt || 'You are a character. Respond naturally and directly.'}\n${REPLY_INSTRUCTIONS}` }]
  });

  for (const msg of history) {
    const role = msg.role === 'model' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: `[id:${msg.id}] ${msg.content}` }] });
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  return contents;
}

/**
 * Safely extracts the text content out of Gemini's response payload
 */
function extractGeminiResponse(result) {
  try {
    const response = result?.response ?? result;
    return response?.text ||
           response?.candidates?.[0]?.content?.parts?.[0]?.text ||
           CHAT_RULES.DEFAULT_ERROR_RESPONSE;
  } catch (err) {
    console.error('Error extracting Gemini response:', err);
    return CHAT_RULES.DEFAULT_ERROR_RESPONSE;
  }
}

/**
 * Main orchestration service that handles user messages, interacts with Gemini, and saves history
 * @param {number} userId - Authenticated user ID
 * @param {number} personajeId - Character/AI personagem ID
 * @param {string} message - User message content
 * @param {number|null} replyToId - Optional ID of the message being replied to
 * @returns {Promise<Object>} Response object with reply messages and success status
 */

export async function chatComPersonagemService(userId, personajeId, message, replyToId = null) {
  const validation = validateMessage(message);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const character = await chatRepository.getCharacterById(personajeId);
  if (!character) {
    throw new Error('Character not found');
  }

  if (replyToId) {
    const referencedMsg = await chatRepository.getMessageById(replyToId);
    if (!referencedMsg) {
      throw new Error('Referenced message not found');
    }
  }

  try {
    const systemPrompt = buildPersonPrompt(character);
    const history = await loadConversationService(userId, personajeId);
    const contents = buildGeminiContents(systemPrompt, message, history);

    const result = await generateContent(contents);
    console.log(`[TOKENS] input: ${result.tokens.input} | output: ${result.tokens.output} | total: ${result.tokens.total}`);

    const respostaIA = extractGeminiResponse(result);
    const rawMessages = respostaIA.split('||').map(m => m.trim()).filter(Boolean);

    const validHistoryIds = new Set(history.map((m) => m.id));

    const parsedMessages = rawMessages.map((m) => {
      const cleanedIdPrefix = m.replace(ID_PREFIX_REGEX, '');
      const match = cleanedIdPrefix.match(REPLY_TAG_REGEX);

      let text;
      let replyToId = null;

      if (match) {
        const refId = Number(match[1]);
        text = cleanedIdPrefix.replace(REPLY_TAG_REGEX, '').trim();
        replyToId = validHistoryIds.has(refId) ? refId : null;
      } else {
        text = cleanedIdPrefix;
      }

      text = stripLeadingEcho(text);

      return { text, replyToId };
    }).filter((m) => m.text);

    const savedUserMessage = await sendMessageService(userId, personajeId, 'user', message, replyToId);

    const savedBotMessages = [];
    for (const { text, replyToId: botReplyToId } of parsedMessages) {
      const saved = await sendMessageService(userId, personajeId, 'model', text, botReplyToId);
      savedBotMessages.push({ ...saved, replyToId: botReplyToId });
    }

    const quotes = {};
    for (const m of savedBotMessages) {
      if (m.replyToId && !quotes[m.replyToId]) {
        const original = history.find((h) => h.id === m.replyToId);
        if (original) {
          quotes[m.replyToId] = {
            id: original.id,
            sender: original.role === 'model' ? 'model' : 'user',
            text: original.content,
          };
        }
      }
    }

    return {
      reply: parsedMessages.map((m) => m.text),
      replyIds: savedBotMessages.map((m) => m.id),
      replyToIds: savedBotMessages.map((m) => m.replyToId),
      quotes,
      figurinha: null,
      success: true
    };
    // ↑↑↑ até aqui ↑↑↑

  } catch (err) {
    console.error('Error inside chatComPersonagemService:', err?.message || err);
    console.error('Stack:', err?.stack);
    throw err;
  }
}

/**
 * Legacy wrapper fallback to maintain compatibility with existing controllers
 */
export async function getHistoricoChatService(userId, personajeId) {
  try {
    return await loadConversationService(userId, personajeId);
  } catch (err) {
    console.error('Error fetching history:', err);
    throw err;
  }
}

/**
 * Clears the chat memory (Kept for routing compatibility, operates directly on repository layer if needed)
 */
export async function limparMemoriaService(userId, personajeId) {
  // Redis cache structures removed to guarantee real-time database state synchronization
  return { success: true };
}

/**
 * Fetch paginated messages of a conversation directly from the database repository
 * @param {number} userId - Authenticated user ID
 * @param {number} characterId - Target character ID
 * @param {number} limit - Database query chunk record limit size
 * @param {number} offset - Cumulative query pagination skip index
 */
export const loadConversationService = async (userId, characterId, limit = 30, offset = 0) => {
  const chatId = await chatRepository.getOrCreateChatId(userId, characterId);
  
  // Queries the database directly as the single source of truth to avoid cache-desync issues
  return await chatRepository.getChatHistory(chatId, limit, offset);
};

/**
 * Append a single message line straight into the database session context
 * @param {number} userId - User ID
 * @param {number} characterId - Character ID
 * @param {string} role - Message role ('user' or 'model')
 * @param {string} content - Message text content
 * @param {number|null} replyToId - Optional ID of the message being replied to
 * @returns {Promise<Object>} The saved message object
 */
export const sendMessageService = async (userId, characterId, role, content, replyToId = null) => {
  if (!content || !role) {
    throw new Error('ROLE_AND_CONTENT_REQUIRED');
  }

  const chatId = await chatRepository.getOrCreateChatId(userId, characterId);
  return await chatRepository.saveMessage(chatId, role, content, replyToId);
};

/**
 * Core business operation logic to permanently drop a message entry out of the database repository
 */
export const deleteMessageService = async (messageId) => {
  if (!messageId) {
    throw new Error('Message ID is required');
  }

  const wasDeleted = await chatRepository.deleteMessage(messageId);
  if (!wasDeleted) {
    throw new Error('MESSAGE_NOT_FOUND');
  }
  
  return { success: true, message: 'Message deleted successfully' };
};

/**
 * Commit dynamic boolean visibility states on specific pinned target messages
 */
export const togglePinMessageService = async (messageId, isPinned) => {
  if (!messageId || isPinned === undefined) {
    throw new Error('Message ID and isPinned status are required');
  }

  const updatedMessage = await chatRepository.togglePinMessage(messageId, isPinned);
  if (!updatedMessage) {
    throw new Error('Message not found to update pin status');
  }

  return updatedMessage;
};

/**
 * Collects structural pinned log arrays matching the active conversation target context
 */
export const getChatPinnedMessages = async (chatId) => {
  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  return await chatRepository.getPinnedMessages(chatId);
};

/**
 * Fetch a single message by ID (used for quote/reply population)
 * @param {number} messageId - Message ID to fetch
 * @returns {Promise<Object|null>} Message object or null if not found
 */
export const getMessageByIdService = async (messageId) => {
  if (!messageId) {
    throw new Error('Message ID is required');
  }

  const message = await chatRepository.getMessageById(messageId);
  if (!message) {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    reply_to_id: message.reply_to_id || null,
    is_pinned: message.is_pinned,
  };
};

export const _internal = {
  validateMessage,
  buildGeminiContents,
  extractGeminiResponse
};
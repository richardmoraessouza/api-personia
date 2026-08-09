import * as chatRepository from '../repositories/chatRepository.js';
import buildPersonPrompt from '../utils/buildPersonPrompt.js';

import { generateContent } from '../utils/geminiClient.js';
import { CHAT_RULES, validateMessage, REPLY_INSTRUCTIONS, VOICE_CALL_INSTRUCTIONS, REPLY_TAG_REGEX, ID_PREFIX_REGEX, REPLY_TAG_FAILSAFE_REGEX, ID_PREFIX_FAILSAFE_REGEX, stripLeadingEcho } from '../../../rules/chatRules.js';
import { detectUserAction, detectCharacterSays } from '../../../rules/missionDetector.js';

const MAX_SESSION_SECONDS = 8 * 60 * 60;
const MIN_SESSION_SECONDS = 5;

export const saveConversationTime = async (userId, characterId, seconds) => {
  if (!userId || !characterId || !seconds) {
    throw new Error('INVALID_PARAMETERS');
  }
  
  if (seconds < MIN_SESSION_SECONDS) return { total_seconds: 0 };
  const capped = Math.min(seconds, MAX_SESSION_SECONDS);

  const character = await chatRepository.getCharacterByIdOrPublicId(characterId);
  if (!character) {
    throw new Error('Character not found');
  }
  
  return await chatRepository.addConversationTime(userId, character.id, capped);
};

export const fetchConversationTime = async (userId, characterId) => {
  if (!userId || !characterId) {
    throw new Error('INVALID_PARAMETERS');
  }
  
  const character = await chatRepository.getCharacterByIdOrPublicId(characterId);
  if (!character) {
    throw new Error('Character not found');
  }
  
  return await chatRepository.getConversationTime(userId, character.id);
};

function buildGeminiContents(systemPrompt, userMessage, history, isVoiceCall = false) {
  const trailingInstructions = isVoiceCall ? VOICE_CALL_INSTRUCTIONS : REPLY_INSTRUCTIONS;
  const contents = [];

  contents.push({
    role: 'model',
    parts: [{ text: `${systemPrompt || 'You are a character. Respond naturally and directly.'}\n${trailingInstructions}` }]
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

// Emotion instructions removed (missions module deleted)

export const ensureAnonymousUserId = async (anonymousKey) => {
  if (!anonymousKey) {
    return null;
  }

  return chatRepository.findOrCreateAnonymousUser(anonymousKey);
};

export async function chatComPersonagemService(userId, personajeId, message, replyToId = null, isVoiceCall = false) {
  const normalizedUserId = Number(userId);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
    throw new Error('INVALID_PARAMETERS');
  }

  const normalizedReplyToId = replyToId != null && replyToId !== '' ? Number(replyToId) : null;
  if (normalizedReplyToId !== null && (!Number.isInteger(normalizedReplyToId) || normalizedReplyToId < 1)) {
    throw new Error('INVALID_PARAMETERS');
  }

  const normalizedText = typeof message === 'string' ? message.trim() : '';
  if (!normalizedText || normalizedText.length === 0) {
    throw new Error('Mensagem não pode ser vazia');
  }

  const validation = validateMessage(message);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  if (message.length > 4000) {
    throw new Error('Mensagem muito longa');
  }

  const character = await chatRepository.getCharacterByIdOrPublicId(personajeId);
  if (!character) {
    throw new Error('Character not found');
  }

  if (normalizedReplyToId) {
    const referencedMsg = await chatRepository.getMessageById(normalizedReplyToId);
    if (!referencedMsg) {
      throw new Error('Referenced message not found');
    }
  }

  try {
    const systemPrompt = buildPersonPrompt(character, isVoiceCall);
    const history = await loadConversationService(normalizedUserId, personajeId);

    const primeiraMensagemDoChat = history.length === 0;

    // Emotion instructions disabled (missions module removed)
    const emotionInstructions = '';
    const fullSystemPrompt = `${systemPrompt}${emotionInstructions}`;

    const contents = buildGeminiContents(fullSystemPrompt, message, history, isVoiceCall);

    const result = await generateContent(contents);
    console.log(`[TOKENS] input: ${result.tokens.input} | output: ${result.tokens.output} | total: ${result.tokens.total}`);

    const respostaBrutaIA = extractGeminiResponse(result);
    console.log("📝 [BACKEND] Resposta bruta vinda do Gemini:", respostaBrutaIA);

    // ── Detecção de emoção ────────────────────────────────────────
    const regexEmotion = /\[EMOTION:([\w_]+)\]/i;
    const matchEmotion = respostaBrutaIA.match(regexEmotion);

    // Missions tracking removed; keep empty completed missions array
    const missoesCompletadas = [];

    // ── Limpa a tag da resposta antes de salvar ───────────────────
    const respostaIA = respostaBrutaIA.replace(/\[EMOTION:[\w_]+\]/gi, '').trim();

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

      // failsafe final: garante que nenhum [id:NUMERO] nem [[REPLY:NUMERO]] sobrevive,
      // não importa onde a IA colocou
      text = text
        .replace(REPLY_TAG_FAILSAFE_REGEX, '')
        .replace(ID_PREFIX_FAILSAFE_REGEX, '')
        .trim();

      return { text, replyToId };
    }).filter((m) => m.text);

    const savedUserMessage = await sendMessageService(
      normalizedUserId,
      personajeId,
      'user',
      message,
      normalizedReplyToId
    );

    const savedBotMessages = [];
    for (const { text, replyToId: botReplyToId } of parsedMessages) {
      const saved = await sendMessageService(normalizedUserId, personajeId, 'model', text, botReplyToId);
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
      id: savedUserMessage.id,
      reply: parsedMessages.map((m) => m.text),
      replyIds: savedBotMessages.map((m) => m.id),
      replyToIds: savedBotMessages.map((m) => m.replyToId),
      quotes,
      figurinha: null,
      missoesCompletadas,
      success: true
    };

  } catch (err) {
    console.error('Error inside chatComPersonagemService:', err?.message || err);
    console.error('Stack:', err?.stack);
    throw err;
  }
}

export async function getHistoricoChatService(userId, personajeId) {
  try {
    return await loadConversationService(userId, personajeId);
  } catch (err) {
    console.error('Error fetching history:', err);
    throw err;
  }
}

export async function limparMemoriaService(userId, personajeId) {
  return { success: true };
}

export const loadConversationService = async (userId, characterId, limit = 30, offset = 0) => {
  if (!userId || !characterId) {
    throw new Error('INVALID_PARAMETERS');
  }
  
  const character = await chatRepository.getCharacterByIdOrPublicId(characterId);
  if (!character) {
    throw new Error('Character not found');
  }
  
  const chatId = await chatRepository.getOrCreateChatId(userId, character.id);
  return await chatRepository.getChatHistory(chatId, limit, offset);
};

export const sendMessageService = async (userId, characterId, role, content, replyToId = null) => {
  const hasText = typeof content === 'string' && content.trim().length > 0;

  if (!role || !userId || !characterId || !hasText) {
    throw new Error('ROLE_AND_CONTENT_REQUIRED');
  }

  const character = await chatRepository.getCharacterByIdOrPublicId(characterId);
  if (!character) {
    throw new Error('Character not found');
  }

  const chatId = await chatRepository.getOrCreateChatId(userId, character.id);
  return await chatRepository.saveMessage(chatId, role, content, replyToId);
};

export const deleteMessageService = async (messageId, userId) => {
  const normalizedMessageId = Number(messageId);
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedMessageId) || normalizedMessageId < 1 || normalizedMessageId > 2147483647) {
    throw new Error('INVALID_MESSAGE_ID');
  }

  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
    throw new Error('INVALID_USER_ID');
  }

  const wasDeleted = await chatRepository.deleteMessage(normalizedMessageId, normalizedUserId);
  if (!wasDeleted) {
    throw new Error('MESSAGE_NOT_FOUND');
  }
  
  return { success: true, message: 'Message deleted successfully' };
};

export const togglePinMessageService = async (messageId, isPinned, userId) => {
  const normalizedMessageId = Number(messageId);
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedMessageId) || normalizedMessageId < 1 || normalizedMessageId > 2147483647) {
    throw new Error('INVALID_MESSAGE_ID');
  }

  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
    throw new Error('INVALID_USER_ID');
  }

  if (isPinned === undefined) {
    throw new Error('Message ID, isPinned status and user ID are required');
  }

  const updatedMessage = await chatRepository.togglePinMessage(normalizedMessageId, isPinned, normalizedUserId);
  if (!updatedMessage) {
    throw new Error('Message not found to update pin status');
  }

  return updatedMessage;
};

export const getChatPinnedMessages = async (chatId, userId) => {
  if (!chatId || !userId) {
    throw new Error('Chat ID and user ID are required');
  }

  return await chatRepository.getPinnedMessages(chatId, userId);
};

export const getMessageByIdService = async (messageId, userId) => {
  const normalizedMessageId = Number(messageId);
  const normalizedUserId = Number(userId);

  if (!Number.isInteger(normalizedMessageId) || normalizedMessageId < 1 || normalizedMessageId > 2147483647) {
    throw new Error('INVALID_MESSAGE_ID');
  }

  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
    throw new Error('INVALID_USER_ID');
  }

  const message = await chatRepository.getMessageById(normalizedMessageId, normalizedUserId);
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

export const clearChatHistoryService = async (usuarioId, publicId) => {
  if (!usuarioId || !publicId) {
    throw new Error('Chat ID and user ID are required');
  }

  const personagem = await chatRepository.getCharacterByIdOrPublicId(publicId);
  if (!personagem) {
    const erro = new Error('Personagem não encontrado.');
    erro.status = 404;
    throw erro;
  }

  const chatId = await chatRepository.getOrCreateChatId(usuarioId, personagem.id);

  return await chatRepository.DeleteclearChatHistory(chatId, usuarioId);
}
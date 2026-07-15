import * as chatRepository from '../repositories/chatRepository.js';
import * as missionRepository from '../../../modules/missions/repositories/missionRepository.js'; 
import buildPersonPrompt from '../utils/buildPersonPrompt.js';
import { generateContent } from '../utils/geminiClient.js';
import {CHAT_RULES, validateMessage, REPLY_INSTRUCTIONS, REPLY_TAG_REGEX, ID_PREFIX_REGEX, REPLY_TAG_FAILSAFE_REGEX, ID_PREFIX_FAILSAFE_REGEX, stripLeadingEcho } from '../../../rules/chatRules.js';
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

// Monta o trecho de instruções de emoção com base nas trigger_key ativas no banco
// (tabela personia2.mission_trigger, categoria='EMOTION'). Se a busca falhar,
// retorna string vazia e o chat segue normalmente sem tag de emoção.
async function buildEmotionInstructions() {
  try {
    const emotionKeys = await missionRepository.getEmotionTriggerKeys();
    if (!emotionKeys.length) return '';

    return (
      `\n\nQuando sua fala expressar uma emoção forte e clara, inclua no INÍCIO da resposta ` +
      `uma tag no formato [EMOTION:TAG], escolhendo TAG entre exatamente estas opções: ` +
      `${emotionKeys.join(', ')}. Use no máximo uma tag por resposta, apenas quando fizer ` +
      `sentido emocional real — não force.`
    );
  } catch (err) {
    console.error('Erro ao buscar tags de emoção ativas:', err);
    return '';
  }
}

export async function chatComPersonagemService(userId, personajeId, message, replyToId = null) {
  const normalizedUserId = Number(userId);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) {
    throw new Error('INVALID_PARAMETERS');
  }

  const normalizedReplyToId = replyToId != null && replyToId !== '' ? Number(replyToId) : null;
  if (normalizedReplyToId !== null && (!Number.isInteger(normalizedReplyToId) || normalizedReplyToId < 1)) {
    throw new Error('INVALID_PARAMETERS');
  }

  const validation = validateMessage(message);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (typeof message !== 'string' || message.trim().length > 4000) {
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
    const systemPrompt = buildPersonPrompt(character);
    const history = await loadConversationService(normalizedUserId, personajeId);

    const primeiraMensagemDoChat = history.length === 0;

    // ── Injeta dinamicamente as tags de emoção válidas (vindas do banco) ──
    const emotionInstructions = await buildEmotionInstructions();
    const fullSystemPrompt = `${systemPrompt}${emotionInstructions}`;

    const contents = buildGeminiContents(fullSystemPrompt, message, history);

    const result = await generateContent(contents);
    console.log(`[TOKENS] input: ${result.tokens.input} | output: ${result.tokens.output} | total: ${result.tokens.total}`);

    const respostaBrutaIA = extractGeminiResponse(result);
    console.log("📝 [BACKEND] Resposta bruta vinda do Gemini:", respostaBrutaIA);

    // ── Detecção de emoção ────────────────────────────────────────
    const regexEmotion = /\[EMOTION:([\w_]+)\]/i;
    const matchEmotion = respostaBrutaIA.match(regexEmotion);

    // ── Missões ───────────────────────────────────────────────────
    const missoesCompletadas = [];

    try {
      await missionRepository.trackMissionProgress(userId, 'CHAT_MESSAGES', 1);

      if (primeiraMensagemDoChat) {
        await missionRepository.trackMissionProgress(userId, 'TALK_CHARACTER', 1);
        
        const r = await missionRepository.trackMissionProgress(userId, 'TALK_5_DIFFERENT_CHARACTERS', 1);
        if (r?.completada) missoesCompletadas.push('TALK_5_DIFFERENT_CHARACTERS');
      }

      // TAG EMOTION — IA detecta e retorna a tag; mapeamento vem do banco (mission_trigger)
      if (matchEmotion) {
        const emocao = matchEmotion[1].toUpperCase();
        console.log(`🎯 [EMOTION] ${emocao}`);

        const emotionTriggers = await missionRepository.getTriggersByCategoria('EMOTION');
        const trigger = emotionTriggers.find((t) => t.trigger_key === emocao);

        if (trigger) {
          const r = await missionRepository.trackMissionProgress(userId, trigger.mission_tipo, 1);
          if (r?.completada) missoesCompletadas.push(trigger.mission_tipo);
        } else {
          console.log(`⚠️ [EMOTION] Tag "${emocao}" não corresponde a nenhum trigger ativo no banco.`);
        }
      } else {
        console.log("❌ [BACKEND] Nenhuma tag [EMOTION:...] foi gerada pelo Gemini.");
      }

      // USER_ACTION — padrão vindo do banco, testado na mensagem do usuário
      const userActionType = await detectUserAction(message);
      if (userActionType) {
        console.log(`👤 [USER_ACTION] ${userActionType}`);
        const r = await missionRepository.trackMissionProgress(userId, userActionType, 1);
        if (r?.completada) missoesCompletadas.push(userActionType);
      }

      // CHARACTER_SAYS — padrão vindo do banco, testado na resposta da IA
      const characterSaysType = await detectCharacterSays(respostaBrutaIA);
      if (characterSaysType) {
        console.log(`🤖 [CHARACTER_SAYS] ${characterSaysType}`);
        const r = await missionRepository.trackMissionProgress(userId, characterSaysType, 1);
        if (r?.completada) missoesCompletadas.push(characterSaysType);
      }

    } catch (missionErr) {
      console.error('Erro ao atualizar progresso de missões no banco:', missionErr);
    }

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

    const savedUserMessage = await sendMessageService(normalizedUserId, personajeId, 'user', message, normalizedReplyToId);

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
  if (!content || !role || !userId || !characterId) {
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
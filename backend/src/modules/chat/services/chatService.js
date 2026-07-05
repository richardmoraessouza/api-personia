import * as chatRepository from '../repositories/chatRepository.js';
import * as missionRepository from '../../../modules/missions/repositories/missionRepository.js'; 
import buildPersonPrompt from '../utils/buildPersonPrompt.js';
import { generateContent } from '../utils/geminiClient.js';
import { CHAT_RULES, validateMessage, REPLY_INSTRUCTIONS, REPLY_TAG_REGEX, ID_PREFIX_REGEX, stripLeadingEcho} from '../../../rules/chatRules.js';
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

export async function chatComPersonagemService(userId, personajeId, message, replyToId = null) {
  const validation = validateMessage(message);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const character = await chatRepository.getCharacterByIdOrPublicId(personajeId);
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
    
    const primeiraMensagemDoChat = history.length === 0;

    const contents = buildGeminiContents(systemPrompt, message, history);

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

      // TAG EMOTION — IA detecta e retorna a tag
      if (matchEmotion) {
        const emocao = matchEmotion[1].toUpperCase();
        console.log(`🎯 [EMOTION] ${emocao}`);

        const emotionMap = {
          'BRAVO':        'MAKE_CHARACTER_ANGRY',
          'TRISTE':       'MAKE_CHARACTER_SAD',
          'FELIZ':        'MAKE_CHARACTER_HAPPY',
          'APAIXONADO':   'MAKE_CHARACTER_LOVE',
          'CIUMENTO':     'MAKE_CHARACTER_FEEL_JEALOUS',
          'COM_SAUDADE':  'MAKE_CHARACTER_FEEL_NOSTALGIC',
          'ENVERGONHADO': 'MAKE_CHARACTER_FEEL_EMBARRASSED',
          'NERVOSO':      'MAKE_CHARACTER_FEEL_NERVOUS',
          'ANIMADO':      'MAKE_CHARACTER_FEEL_EXCITED',
          'CONFORTAVEL':  'MAKE_CHARACTER_FEEL_COMFORTABLE',
          'SOZINHO':      'MAKE_CHARACTER_FEEL_LONELY',
          'PROTEGIDO':    'MAKE_CHARACTER_FEEL_PROTECTED',
          'CURIOSO':      'MAKE_CHARACTER_FEEL_CURIOUS',
          'LISONJEADO':   'MAKE_CHARACTER_FEEL_FLATTERED',
          'SURPRESO':     'MAKE_CHARACTER_SURPRISED',
        };

        const missionType = emotionMap[emocao];
        if (missionType) {
          const r = await missionRepository.trackMissionProgress(userId, missionType, 1);
          if (r?.completada) missoesCompletadas.push(missionType);
        }
      } else {
        console.log("❌ [BACKEND] Nenhuma tag [EMOTION:...] foi gerada pelo Gemini.");
      }

      // USER_ACTION — regex na mensagem do usuário
      const userActionType = detectUserAction(message);
      if (userActionType) {
        console.log(`👤 [USER_ACTION] ${userActionType}`);
        const r = await missionRepository.trackMissionProgress(userId, userActionType, 1);
        if (r?.completada) missoesCompletadas.push(userActionType);
      }

      // CHARACTER_SAYS — regex na resposta da IA
      const characterSaysType = detectCharacterSays(respostaBrutaIA);
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

export const getChatPinnedMessages = async (chatId) => {
  if (!chatId) {
    throw new Error('Chat ID is required');
  }

  return await chatRepository.getPinnedMessages(chatId);
};

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
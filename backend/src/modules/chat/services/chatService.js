import * as chatRepository from '../repositories/chatRepository.js';
import buildPersonPrompt from '../utils/buildPersonPrompt.js';
import { generateContent } from '../utils/geminiClient.js';
import { CHAT_RULES, validateMessage } from '../../../rules/chatRules.js';
import * as cacheService from '../../../services/cacheService.js';

function buildGeminiContents(systemPrompt, userMessage, history) {
  const contents = [];

  contents.push({
    role: 'model',
    parts: [{ text: systemPrompt || 'Você é um personagem. Responda de forma natural e direta.' }]
  });

  for (const msg of history) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: msg.text }] });
  }

  contents.push({
    role: 'user',
    parts: [{ text: `User: ${userMessage}` }]
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

export async function chatComPersonagemService(userId, personagemId, message) {
  const validation = validateMessage(message);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const personagem = await chatRepository.getCharacterById(personagemId);
  if (!personagem) {
    throw new Error('Character not found');
  }

  try {
    const systemPrompt = buildPersonPrompt(personagem);
    const history = await cacheService.getLastMessages(userId, personagemId, 10);
    const contents = buildGeminiContents(systemPrompt, message, history);

    const result = await generateContent(contents);
    console.log(`[TOKENS] input: ${result.tokens.input} | output: ${result.tokens.output} | total: ${result.tokens.total}`);

    const respostaIA = extractGeminiResponse(result);

    await cacheService.addToMemory(userId, personagemId, 'user', message);
    await cacheService.addToMemory(userId, personagemId, 'assistant', respostaIA);

    return {
      reply: respostaIA,
      figurinha: null,
      success: true
    };
  } catch (err) {
    console.error('Erro em chatComPersonagemService:', err?.message || err);
    console.error('Stack:', err?.stack);
    throw err;
  }
}

export async function getHistoricoChatService(userId, personagemId) {
  try {
    return await chatRepository.getConversaHistorico(userId, personagemId);
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    throw err;
  }
}

export async function limparMemoriaService(userId, personagemId) {
  return await cacheService.clearMemory(userId, personagemId);
}

export const _internal = {
  validateMessage,
  buildGeminiContents,
  extractGeminiResponse,
  cacheService
};
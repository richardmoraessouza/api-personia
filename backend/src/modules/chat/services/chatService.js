import * as chatRepository from '../repositories/chatRepository.js';
import buildPersonPrompt from '../utils/buildPersonPrompt.js';
import { generateContent } from '../utils/geminiClient.js';
import { CHAT_RULES, validateMessage } from '../../../rules/chatRules.js';
import * as cacheService from '../../../services/cacheService.js';

// validateMessage é importada de chatRules.js

/**
 * Prepara conteúdo para enviar ao Gemini
 */
function buildGeminiContents(systemPrompt, userMessage, history) {
  const contents = [];

  // Adiciona prompt do sistema
  contents.push({
    role: 'model',
    parts: [{
      text: systemPrompt || 'Você é um personagem. Responda de forma natural e direta.'
    }]
  });

  // Adiciona histórico
  for (const msg of history) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    contents.push({
      role,
      parts: [{ text: msg.text }]
    });
  }

  // Add user message
  contents.push({
    role: 'user',
    parts: [{ text: `User: ${userMessage}` }]
  });

  return contents;
}

/**
 * Extract response from Gemini
 */
function extractGeminiResponse(response) {
  try {
    return response.candidates?.[0]?.content?.parts?.[0]?.text ||
           CHAT_RULES.DEFAULT_ERROR_RESPONSE;
  } catch (err) {
    console.error('Error extracting Gemini response:', err);
    return CHAT_RULES.DEFAULT_ERROR_RESPONSE;
  }
}

/**
 * Chat com personagem - lógica principal
 */
export async function chatComPersonagemService(userId, personagemId, message) {
  // Valida mensagem
  const validation = validateMessage(message);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Busca personagem
  const personagem = await chatRepository.getPersonagemById(personagemId);
  if (!personagem) {
    throw new Error('Character not found');
  }

  try {
    // Constrói prompt do personagem
    const systemPrompt = buildPersonPrompt(personagem);

    // Obtém histórico do Redis
    const history = await cacheService.getLastMessages(userId, personagemId, 10);

    // Monta conteúdo para Gemini
    const contents = buildGeminiContents(systemPrompt, message, history);

    // Chama Gemini
    const response = await generateContent(contents);

    // Extrai resposta
    const respostaIA = extractGeminiResponse(response);

    // Salva na memória (Redis)
    await cacheService.addToMemory(userId, personagemId, 'user', message);
    await cacheService.addToMemory(userId, personagemId, 'assistant', respostaIA);

    return {
      reply: respostaIA,
      figurinha: null,
      success: true
    };
  } catch (err) {
    console.error('Erro em chatComPersonagemService:', err);
    throw err;
  }
}

/**
 * Obtém histórico de chat
 */
export async function getHistoricoChatService(userId, personagemId) {
  try {
    const historico = await chatRepository.getConversaHistorico(userId, personagemId);
    return historico;
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    throw err;
  }
}

/**
 * Limpa memória em cache
 */
export async function limparMemoriaService(userId, personagemId) {
  return await cacheService.clearMemory(userId, personagemId);
}

/**
 * Exporta para testes
 */
export const _internal = {
  validateMessage,
  buildGeminiContents,
  extractGeminiResponse,
  cacheService
};

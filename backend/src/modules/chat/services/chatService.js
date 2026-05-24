import * as chatRepository from '../repositories/chatRepository.js';
import buildPersonPrompt from '../utils/buildPersonPrompt.js';
import { generateContent } from '../utils/geminiClient.js';

const conversationMemory = new Map();

/**
 * Adiciona mensagem à memória de conversa
 */
function addToMemory(userId, personagemId, role, text) {
  const key = `${userId}_${personagemId}`;
  const mem = conversationMemory.get(key) || [];

  mem.push({
    role,
    text,
    ts: Date.now()
  });

  // Mantém apenas as últimas 20 mensagens
  if (mem.length > 20) {
    mem.splice(0, mem.length - 20);
  }

  conversationMemory.set(key, mem);
}

/**
 * Obtém as últimas mensagens da memória
 */
function getLastMessages(userId, personagemId, limit = 10) {
  const key = `${userId}_${personagemId}`;
  const mem = conversationMemory.get(key) || [];
  return mem.slice(-limit);
}

/**
 * Limpa memória de conversa
 */
function clearMemory(userId, personagemId) {
  const key = `${userId}_${personagemId}`;
  conversationMemory.delete(key);
}

/**
 * Valida mensagem do usuário
 */
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Mensagem vazia 😅' };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: 'Mensagem vazia 😅' };
  }

  return { valid: true };
}

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

  // Adiciona mensagem do usuário
  contents.push({
    role: 'user',
    parts: [{ text: `Usuário: ${userMessage}` }]
  });

  return contents;
}

/**
 * Extrai resposta do Gemini
 */
function extractGeminiResponse(response) {
  try {
    return response.candidates?.[0]?.content?.parts?.[0]?.text ||
           "Não consegui responder agora 😢";
  } catch (err) {
    console.error('Erro ao extrair resposta Gemini:', err);
    return "Não consegui responder agora 😢";
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
    throw new Error('Personagem não encontrado');
  }

  try {
    // Constrói prompt do personagem
    const systemPrompt = buildPersonPrompt(personagem);

    // Obtém histórico
    const history = getLastMessages(userId, personagemId, 10);

    // Monta conteúdo para Gemini
    const contents = buildGeminiContents(systemPrompt, message, history);

    // Chama Gemini
    const response = await generateContent(contents);

    // Extrai resposta
    const respostaIA = extractGeminiResponse(response);

    // Salva na memória
    addToMemory(userId, personagemId, 'user', message);
    addToMemory(userId, personagemId, 'assistant', respostaIA);

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
export function limparMemoriaService(userId, personagemId) {
  clearMemory(userId, personagemId);
}

/**
 * Exporta para testes
 */
export const _internal = {
  addToMemory,
  getLastMessages,
  clearMemory,
  validateMessage,
  buildGeminiContents,
  extractGeminiResponse
};

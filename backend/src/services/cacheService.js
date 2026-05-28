import redisClient from '../config/redis.js';
import { CHAT_RULES } from '../rules/chatRules.js';

/**
 * Serviço de Cache com Redis
 * Substitui o Map() de memória para funcionar com múltiplas instâncias
 */

/**
 * Adiciona mensagem ao histórico de conversa em cache
 * @param {string} userId
 * @param {string} personagemId
 * @param {string} role - 'user' ou 'assistant'
 * @param {string} text
 */
export async function addToMemory(userId, personagemId, role, text) {
  try {
    const key = `chat:${userId}:${personagemId}`;
    
    const message = JSON.stringify({
      role,
      text,
      ts: Date.now()
    });

    // Adiciona à lista e define TTL para expirar automaticamente
    await redisClient.lPush(key, message);
    await redisClient.expire(key, CHAT_RULES.CACHE_TTL / 1000); // Converte ms para segundos

    // Mantém apenas as últimas MEMORY_LIMIT mensagens
    await redisClient.lTrim(key, 0, CHAT_RULES.MEMORY_LIMIT - 1);

  } catch (err) {
    console.error('Erro ao adicionar mensagem ao cache:', err);
    // Não falha a conversa se Redis falhar
  }
}

/**
 * Obtém as últimas mensagens do histórico
 * @param {string} userId
 * @param {string} personagemId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getLastMessages(userId, personagemId, limit = CHAT_RULES.MESSAGE_HISTORY_LIMIT) {
  try {
    const key = `chat:${userId}:${personagemId}`;
    
    // Busca as últimas mensagens (Redis list é LIFO, então inverte)
    const messages = await redisClient.lRange(key, 0, limit - 1);
    
    // Converte de volta para objeto e ordena cronologicamente
    return messages
      .map(msg => {
        try {
          return JSON.parse(msg);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse(); // Inverte para ordem cronológica (mais antigo primeiro)

  } catch (err) {
    console.error('Erro ao buscar mensagens do cache:', err);
    return []; // Retorna vazio se falhar
  }
}

/**
 * Limpa todo o histórico de conversa
 * @param {string} userId
 * @param {string} personagemId
 */
export async function clearMemory(userId, personagemId) {
  try {
    const key = `chat:${userId}:${personagemId}`;
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.error('Erro ao limpar cache:', err);
    return false;
  }
}

/**
 * Obtém informações de saúde do cache
 * @returns {Promise<Object>}
 */
export async function getHealthStatus() {
  try {
    const info = await redisClient.ping();
    const dbSize = await redisClient.dbSize();
    
    return {
      status: 'connected',
      redis: info === 'PONG' ? 'OK' : 'WARN',
      keys: dbSize
    };
  } catch (err) {
    return {
      status: 'disconnected',
      error: err.message
    };
  }
}

/**
 * Limpa tudo o cache (cuidado em produção!)
 */
export async function flushAll() {
  try {
    await redisClient.flushAll();
    return true;
  } catch (err) {
    console.error('Erro ao limpar Redis:', err);
    return false;
  }
}

export default {
  addToMemory,
  getLastMessages,
  clearMemory,
  getHealthStatus,
  flushAll
};

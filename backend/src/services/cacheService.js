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

/**
 * FUNÇÕES GENÉRICAS DE CACHE (para dados simples e objetos JSON)
 */

/**
 * Armazena dados em cache com TTL automático
 * Se Redis falhar, continua sem cache (graceful degradation)
 * @param {string} key - Chave do cache
 * @param {any} value - Valor a armazenar
 * @param {number} ttlSeconds - TTL em segundos (default: 300s = 5 min)
 */
export async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    if (!redisClient.isOpen) return; // Se Redis não está conectado, pula
    
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.set(key, data, {
      EX: ttlSeconds
    });
  } catch (err) {
    // Falha silenciosa - log apenas se quiser debugar
    // console.debug(`[Cache SET] ${key} skipped (Redis unavailable)`);
  }
}

/**
 * Recupera dados do cache
 * Se Redis falhar, retorna null (fallback para DB)
 * @param {string} key - Chave do cache
 * @returns {Promise<any|null>}
 */
export async function cacheGet(key) {
  try {
    if (!redisClient.isOpen) return null; // Se Redis não está conectado, retorna null
    
    const data = await redisClient.get(key);
    if (!data) return null;
    
    // Tenta parsear como JSON, se falhar retorna como string
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (err) {
    // Falha silenciosa
    return null;
  }
}

/**
 * Deleta chave do cache
 * @param {string} key - Chave ou padrão (suporta wildcards com DEL)
 */
export async function cacheDel(key) {
  try {
    if (!redisClient.isOpen) return; // Se Redis não está conectado, pula
    await redisClient.del(key);
  } catch (err) {
    // Falha silenciosa
  }
}

/**
 * Invalida múltiplas chaves por padrão (ex: 'popular:*')
 * @param {string} pattern - Padrão com wildcards
 */
export async function cacheInvalidatePattern(pattern) {
  try {
    if (!redisClient.isOpen) return; // Se Redis não está conectado, pula
    
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    // Falha silenciosa
  }
}

/**
 * Wrapper para implementar cache com fallback automático
 * Se Redis falhar, busca direto do banco (graceful degradation)
 * @param {string} key - Chave do cache
 * @param {Function} fetchFunction - Função que busca dados do banco
 * @param {number} ttlSeconds - TTL em segundos
 * @returns {Promise<any>}
 */
export async function cacheWithFallback(key, fetchFunction, ttlSeconds = 300) {
  try {
    // Tenta cache primeiro (se Redis está disponível)
    if (redisClient.isOpen) {
      const cached = await cacheGet(key);
      if (cached) {
        return cached;
      }
    }

    // Cache miss ou Redis offline - busca do banco
    const data = await fetchFunction();

    // Armazena em cache (se Redis está disponível)
    if (data && redisClient.isOpen) {
      await cacheSet(key, data, ttlSeconds);
    }

    return data || [];
  } catch (err) {
    console.error(`[Cache Fallback Error] ${key}:`, err.message);
    return [];
  }
}

export default {
  addToMemory,
  getLastMessages,
  clearMemory,
  getHealthStatus,
  flushAll,
  cacheSet,
  cacheGet,
  cacheDel,
  cacheInvalidatePattern,
  cacheWithFallback
};

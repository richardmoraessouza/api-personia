import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Max Redis reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return retries * 100; // Exponential backoff
    }
  },
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
});

let isRedisReady = false;

redisClient.on('connect', () => {
  console.log('✅ Redis conectado');
});

redisClient.on('error', (err) => {
  console.error('❌ Erro Redis:', err.message);
});

redisClient.on('ready', () => {
  isRedisReady = true;
  console.log('✅ Redis pronto para usar');
});

redisClient.on('disconnect', () => {
  isRedisReady = false;
  console.warn('⚠️ Redis desconectado');
});

// Conecta ao Redis com tratamento de erro
export async function initializeRedis() {
  try {
    await redisClient.connect();
    console.log('✅ Conexão Redis iniciada');
    return true;
  } catch (err) {
    console.error('❌ Falha ao conectar ao Redis:', err.message);
    console.error('⚠️ Redis offline - cache desabilitado');
    return false;
  }
}

export function isRedisConnected() {
  return isRedisReady;
}

export function getRedisClient() {
  return redisClient;
}

export default redisClient;

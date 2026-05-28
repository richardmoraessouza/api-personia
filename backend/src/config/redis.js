import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Max Redis reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return retries * 100; // Exponential backoff
    }
  },
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
});

redisClient.on('connect', () => {
  console.log('✓ Redis conectado');
});

redisClient.on('error', (err) => {
  console.error('Erro Redis:', err);
});

redisClient.on('ready', () => {
  console.log('✓ Redis pronto para usar');
});

// Conecta ao Redis
await redisClient.connect();

export default redisClient;

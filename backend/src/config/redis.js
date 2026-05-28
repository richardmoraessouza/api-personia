import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Max Redis reconnection attempts reached');
        return new Error('Max reconnection attempts reached');
      }
      return retries * 100; // Exponential backoff
    }
  }
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

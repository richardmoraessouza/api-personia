#!/usr/bin/env node
/**
 * Script para testar a conexão com Redis e o serviço de cache
 * Execute: node scripts/test_redis.js
 */

import redis from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

async function testRedis() {
  console.log('🧪 Testando conexão com Redis...\n');
  
  try {
    await redisClient.connect();
    console.log('✅ Conexão estabelecida!\n');

    // Test 1: PING
    console.log('📍 Teste 1: PING');
    const ping = await redisClient.ping();
    console.log(`   Resposta: ${ping}\n`);

    // Test 2: SET/GET
    console.log('📍 Teste 2: SET/GET');
    await redisClient.set('test_key', 'teste_valor', { EX: 10 });
    const value = await redisClient.get('test_key');
    console.log(`   SET test_key = "teste_valor"`);
    console.log(`   GET test_key = "${value}"\n`);

    // Test 3: LPUSH/LRANGE (para chat)
    console.log('📍 Teste 3: Lista (como chat history)');
    await redisClient.del('test_list');
    await redisClient.lPush('test_list', JSON.stringify({ role: 'user', text: 'Oi' }));
    await redisClient.lPush('test_list', JSON.stringify({ role: 'assistant', text: 'Olá!' }));
    const list = await redisClient.lRange('test_list', 0, -1);
    console.log(`   Adicionadas 2 mensagens`);
    console.log(`   Lista tem ${list.length} itens\n`);

    // Test 4: Informações do servidor
    console.log('📍 Teste 4: Status do servidor');
    const dbSize = await redisClient.dbSize();
    const info = await redisClient.info('server');
    const lines = info.split('\n').slice(0, 5);
    console.log(`   Keys no banco: ${dbSize}`);
    console.log(`   ${lines.join('\n   ')}\n`);

    console.log('✅ Todos os testes passaram!');
    console.log('✅ Redis está pronto para usar com o chat\n');

  } catch (err) {
    console.error('❌ Erro ao testar Redis:');
    console.error(`   ${err.message}\n`);
    console.error('💡 Dicas:');
    console.error('   1. Certifique-se de que o Redis está rodando');
    console.error('   2. Verifique REDIS_HOST e REDIS_PORT no .env');
    console.error('   3. Se usar WSL: `redis-server`');
    console.error('   4. Se usar Docker: `docker run -d -p 6379:6379 redis:latest`\n');
    process.exit(1);

  } finally {
    await redisClient.quit();
  }
}

testRedis();

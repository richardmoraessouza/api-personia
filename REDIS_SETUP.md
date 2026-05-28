# ✅ Cache com Redis - Guia de Implementação

## 📋 O que mudou?

Substituímos o cache em memória (Map) por **Redis**, permitindo que funcione com múltiplas instâncias do servidor.

### Antes ❌
```javascript
const conversationMemory = new Map(); // Perde dados ao reiniciar
// Não compartilha dados entre instâncias
```

### Depois ✅
```javascript
import redisClient from '../config/redis.js';
// Compartilha dados entre TODAS as instâncias
// Persiste dados com TTL
```

---

## 🚀 Como Configurar

### 1. Instalar o Redis (Windows)

**Opção A: Windows Subsystem for Linux (WSL)**
```bash
wsl
sudo apt-get update
sudo apt-get install redis-server
redis-server
```

**Opção B: Docker**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Opção C: Redis para Windows (recomendado)**
- Baixe em: https://github.com/microsoftarchive/redis/releases
- Ou use: `choco install redis` (se tiver Chocolatey)

### 2. Instalar dependências
```bash
cd backend
npm install
```

### 3. Configurar .env
```bash
# Copie .env.example para .env
cp .env.example .env

# Edite com suas credenciais:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 4. Rodar o servidor
```bash
npm dev
# Você verá:
# ✓ Redis conectado
# ✓ Redis pronto para usar
```

---

## 🔧 Mudanças nos Arquivos

### Criados:
- ✅ `src/config/redis.js` - Configuração do Redis
- ✅ `src/services/cacheService.js` - API de cache
- ✅ `.env.example` - Template de variáveis

### Modificados:
- ✅ `package.json` - Adicionado `redis: ^4.6.12`
- ✅ `src/modules/chat/services/chatService.js` - Usa cacheService
- ✅ `src/modules/chat/controllers/chatController.js` - Async/await

---

## 📊 Comparação de Performance

| Aspecto | Map (Antes) | Redis (Depois) |
|---------|----------|-----------|
| **Múltiplas instâncias** | ❌ Não compartilha | ✅ Compartilhado |
| **Persistência ao reiniciar** | ❌ Perde tudo | ✅ Mantém dados |
| **TTL automático** | ❌ Manual | ✅ Automático |
| **Escalabilidade** | 🔴 Limitada | 🟢 Excelente |
| **Gerenciamento de memória** | ⚠️ Cresce indefinido | ✅ Limitado |

---

## 🎯 Próximos Passos Recomendados

1. **Clustering Node.js** - Use múltiplos cores
2. **Gzip compression** - Reduzir tamanho de respostas
3. **Pool PostgreSQL** - Aumentar conexões simultâneas
4. **Timeouts nas APIs** - Evitar travamentos

---

## 📞 Troubleshooting

### Redis não conecta?
```bash
# Verifique se o Redis está rodando
redis-cli ping
# Deve responder com PONG

# Se não funcionar, inicie:
redis-server
```

### Erro "ERR WRONGTYPE Operation against a key holding the wrong kind of value"?
```bash
# Limpe o Redis e reinicie:
redis-cli FLUSHALL
npm dev
```

### Memória do Redis cheia?
```bash
# Configure limite em produção
# Adicione ao redis.conf:
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## 📚 Documentação
- Redis Node.js: https://github.com/redis/node-redis
- Redis CLI: https://redis.io/commands/

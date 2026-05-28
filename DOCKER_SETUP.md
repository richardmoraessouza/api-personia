# 🐳 Setup Docker - PersonIA Backend

## 📋 O que foi configurado?

O `docker-compose.yml` agora gerencia:
- **PostgreSQL 16**: Banco de dados principal
- **Redis 7**: Cache distribuído
- **Backend Node.js**: Sua API Express

---

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo exemplo
cp .env.example .env

# Edite conforme necessário (deixar padrão funciona para desenvolvimento)
```

### 2. Iniciar os Containers

```bash
# Build e inicia todos os serviços
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f backend
```

### 3. Parar os Containers

```bash
# Para todos os serviços
docker-compose down

# Para e remove volumes (cuidado: deleta dados!)
docker-compose down -v
```

### 4. Rebuild após mudanças

```bash
# Rebuild da imagem
docker-compose build

# Rebuild e restart
docker-compose up -d --build
```

---

## 📊 Comandos Úteis

### Acessar Banco de Dados
```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U personia_user -d personia_db

# Listar tabelas
\dt personia2.*
```

### Acessar Redis
```bash
# Conectar ao Redis CLI
docker-compose exec redis redis-cli -a redis_password

# Ver chaves em cache
KEYS *
```

### Ver Status dos Serviços
```bash
# Status de todos os containers
docker-compose ps

# Logs do backend
docker-compose logs backend --tail=50

# Logs do postgres
docker-compose logs postgres --tail=50
```

---

## 🔧 Troubleshooting

### Backend conecta, mas BD não inicia

```bash
# Remover volumes antigos
docker-compose down -v

# Reconstruir
docker-compose build --no-cache

# Iniciar novamente
docker-compose up -d
```

### Porta 5432 ou 6379 já em uso

Editar `docker-compose.yml` e mudar:
```yaml
ports:
  - "5433:5432"  # PostgreSQL em porta 5433
  - "6380:6379"  # Redis em porta 6380
```

### Health check falha

Aguarde 20-30 segundos na primeira inicialização. Se persistir:
```bash
# Ver logs detalhados
docker-compose logs postgres
docker-compose logs redis

# Reiniciar apenas o serviço com problema
docker-compose restart postgres
```

---

## 🌍 Acessos

- **Backend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 📝 Arquivo .env

As variáveis padrão funcionam perfeitamente para desenvolvimento. Para produção, altere:
- `PGPASSWORD`
- `REDIS_PASSWORD`
- `NODE_ENV=production`

---

## 🎯 Próximos Passos

1. Copie seu `.env` com as chaves da OpenAI API
2. Execute `docker-compose up -d`
3. Verifique: `docker-compose logs backend`
4. Acesse: http://localhost:3000

Boa sorte! 🚀

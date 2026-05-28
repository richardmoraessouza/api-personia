# Arquitetura de Regras de Negócio

## 📁 Nova Estrutura

As regras de negócio foram centralizadas em uma pasta dedicada:

```
backend/src/
├── rules/
│   ├── index.js                 # Exportação central
│   ├── README.md                # Documentação
│   ├── chatRules.js             # ✅ Regras de Chat & IA
│   ├── authRules.js             # ✅ Autenticação
│   ├── socialRules.js           # ✅ Ações Sociais
│   ├── personagemRules.js       # ✅ Personagens
│   └── rateLimiterRules.js      # ✅ Rate Limiting
├── modules/
├── middleware/
└── config/
```

## 🎯 Benefícios

- ✅ **Centralização**: Todas as rules em um lugar
- ✅ **Reutilização**: Importar em qualquer módulo
- ✅ **Manutenção**: Fácil atualizar regras globais
- ✅ **Testes**: Validações isoladas e testáveis
- ✅ **Documentação**: Constraints claros no código
- ✅ **Onboarding**: Novos devs entendem rapidamente

## 📖 Como Usar

### Importar uma regra específica

```javascript
import { CHAT_RULES, validateMessage } from '../../../rules/chatRules.js';
```

### Usar constantes

```javascript
const maxMemory = CHAT_RULES.MEMORY_LIMIT;  // 20
const ttl = CHAT_RULES.CACHE_TTL;           // 60000
```

### Usar validações

```javascript
const result = validateMessage(userInput);
if (!result.valid) {
  throw new Error(result.error);
}
```

## 🔄 Arquivos Atualizados

### ✅ Chat
- `modules/chat/services/chatService.js` - usa `CHAT_RULES`
- `modules/chat/utils/buildPersonPrompt.js` - usa regras de personagem

### ✅ Auth
- `modules/auth/services/authService.js` - usa `AUTH_RULES`

### ✅ Middleware
- `middleware/rateLimiter.js` - usa `RATE_LIMITER_RULES`

### ✅ Personagens
- `modules/characters/services/personService.js` - usa `PERSONAGEM_RULES`

## 📋 Próximos Passos (Opcional)

1. Atualizar social services com `SOCIAL_RULES`
2. Criar testes unitários para validações
3. Adicionar CLI para consultar regras: `npm run show:rules`

---

Veja [rules/README.md](./src/rules/README.md) para documentação completa.

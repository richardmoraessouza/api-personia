# Regras de Negócio

Centralização de todas as regras de negócio da aplicação PersonIA.

## Estrutura

```
rules/
├── index.js                 # Exporta todas as regras
├── chatRules.js             # Regras de chat e IA
├── authRules.js             # Regras de autenticação
├── socialRules.js           # Regras de ações sociais
├── personagemRules.js       # Regras de personagens
├── rateLimiterRules.js      # Regras de rate limiting
└── README.md                # Este arquivo
```

## Como usar

### Importar regras específicas

```javascript
import { CHAT_RULES, validateMessage } from '../rules/chatRules.js';
```

### Importar todas as regras

```javascript
import * as rules from '../rules/index.js';
```

## Regras disponíveis

### chatRules.js
- `CHAT_RULES`: Configurações de chat, memória e validações
- `validateMessage()`: Valida mensagens do usuário
- `buildCharacterPromptRules()`: Monta regras de prompt para personagem
- `GENERAL_CHARACTER_RULES`: Regras gerais para qualquer personagem
- `FICTIONAL_CHARACTER_RULES`: Regras específicas para personagens ficcionais
- `PERSON_CHARACTER_RULES`: Regras específicas para personagens tipo "person"

### authRules.js
- `AUTH_RULES`: Configurações JWT, erros e validações
- `validateCreateUserData()`: Valida dados de criação de usuário
- `validateLoginData()`: Valida dados de login

### socialRules.js
- `SOCIAL_RULES`: Validações e mensagens de erro para ações sociais
- `validateSocialIds()`: Valida IDs de usuário e personagem
- `validateNotOwnCharacter()`: Valida se é ação em próprio personagem

### personagemRules.js
- `PERSONAGEM_RULES`: Configurações, limites e validações
- `validatePersonagemTipo()`: Valida tipo de personagem
- `validatePersonagemData()`: Valida dados completos do personagem
- `validatePersonagemAccess()`: Valida acesso do usuário ao personagem

### rateLimiterRules.js
- `RATE_LIMITER_RULES`: Configurações de rate limiting por tipo
  - `SOCIAL`: 200 req/15 min
  - `AUTH`: 5 req/15 min
  - `CHAT`: 30 req/min

## Benefícios

✅ Centralização de regras de negócio  
✅ Fácil manutenção e atualização  
✅ Reutilização em múltiplos módulos  
✅ Testes isolados de validações  
✅ Documentação clara de constraints  
✅ Onboarding facilitado para novos devs  

## Exemplo de uso

```javascript
import { CHAT_RULES, validateMessage } from '../rules/chatRules.js';

// Usar constantes
const maxMemory = CHAT_RULES.MEMORY_LIMIT;

// Usar validações
const result = validateMessage(userInput);
if (!result.valid) {
  throw new Error(result.error);
}
```

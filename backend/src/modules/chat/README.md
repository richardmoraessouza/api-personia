# Módulo Chat IA

Módulo de chat com personagens usando Google Gemini API com arquitetura Clean Code.

## Estrutura

```
modules/chat_ia/
├── controllers/
│   └── chatController.js       # Handlers HTTP
├── services/
│   └── chatService.js          # Lógica de negócio
├── repository/
│   └── chatRepository.js       # Acesso ao banco de dados
├── routes/
│   └── chatRoutes.js           # Definição de rotas
├── utils/
│   ├── buildPersonPrompt.js    # Builder de prompts
│   └── geminiClient.js         # Cliente Gemini com fallback de chaves
└── index.js                    # Exportações
```

## Endpoints

### POST `/chat_ia/:personagemId`
Chat com personagem

**Request Body:**
```json
{
  "message": "Olá, tudo bem?"
}
```

**Response:**
```json
{
  "reply": "Oi! Tudo certo por aqui 😊",
  "figurinha": null,
  "success": true
}
```

### GET `/chat_ia/:personagemId/historico`
Busca histórico de chat

**Response:**
```json
[
  {
    "role": "user",
    "text": "Olá, tudo bem?"
  },
  {
    "role": "assistant",
    "text": "Oi! Tudo certo por aqui 😊"
  }
]
```

### DELETE `/chat_ia/:personagemId/limpar` *(Requer autenticação)*
Limpa histórico em cache

**Response:**
```json
{
  "success": true,
  "message": "Memória limpa com sucesso"
}
```

## Camadas

### Utils
- **buildPersonPrompt.js**: Constrói prompts baseado no tipo de personagem (Ficcional/Person)
- **geminiClient.js**: Gerencia múltiplas chaves Gemini com fallback automático

### Repository
- Acesso direto ao banco de dados
- Cache de personagens (TTL: 5 minutos)
- Operações em histórico de conversa

### Service
- Lógica de chat (validação, memória, Gemini)
- Memória em cache das últimas 20 mensagens
- Tratamento de erros específicos

### Controller
- Handlers HTTP
- Extração de dados de request
- Respostas formatadas

## Variáveis de Ambiente

```env
GEMINI_API_KEY=xxxxx
GEMINI_API_KEY2=xxxxx
GEMINI_API_KEY3=xxxxx
GEMINI_API_KEY4=xxxxx
GEMINI_API_KEY5=xxxxx
GEMINI_KEYS=xxxxx,yyyyy,zzzzz  # Opcional: chaves adicionais separadas por vírgula
```

## Fluxo de Requisição

```
Request HTTP
    ↓
Controller (validação e extração)
    ↓
Service (lógica de negócio)
    ↓
Repository (dados)
    ↓
Gemini API
    ↓
Response
```

## Features

✅ Memória em cache (últimas 20 mensagens)
✅ Gerenciamento automático de múltiplas chaves Gemini
✅ Tipos de personagem: Ficcional e Person
✅ Prompts customizados por tipo
✅ Tratamento robusto de erros
✅ Cache de personagens (5 min TTL)
✅ Suporte a usuários anônimos

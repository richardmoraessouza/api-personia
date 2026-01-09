# PersonIA - API Backend

API RESTful para interação com personagens alimentados por Inteligência Artificial. Permite que usuários conversem com personagens fictícios ou personas personalizadas através de uma interface de chat inteligente.

## � Sumário

- [🔗 Links](#-links)
- [✨ Funcionalidades Principais](#-funcionalidades-principais)
- [🛠️ Tecnologias](#️-tecnologias)
- [📦 Instalação](#-instalação)
- [📚 Documentação da API](#-documentação-da-api)
  - [🔐 Autenticação e Usuários](#-autenticação-e-usuários)
  - [🎭 Personagens](#-personagens)
  - [💬 Chat](#-chat)
  - [👥 Sistema Social](#-sistema-social)
- [📝 Códigos de Status HTTP](#-códigos-de-status-http)
- [🔒 Segurança](#-segurança)
- [🌍 Contato](#-contato)
- [🤝 Contribuindo](#-contribuindo)

## �🔗 Links

- 🌐 **Aplicação Web**: [https://personia.netlify.app/](https://personia.netlify.app/)
- 📦 **Repositório GitHub**: [https://github.com/richardmoraessouza/api-personia](https://github.com/richardmoraessouza/api-personia)
- 🚀 **API em Produção**: [https://api-personia.onrender.com](https://api-personia.onrender.com)

## ✨ Funcionalidades Principais

- 💬 **Chat com Personagens IA**: Converse com personagens alimentados por IA com personalidades únicas
- 🎨 **Dois Tipos de Personagens**: 
  - Personagens fictícios de obras conhecidas
  - Personas personalizadas criadas pelos usuários
- 👤 **Sistema de Usuários**: Cadastro, login e perfis personalizados
- 🔐 **Autenticação JWT**: Sistema seguro de autenticação
- 📊 **Gerenciamento de Personagens**: Crie, edite e gerencie seus personagens
- 👥 **Sistema Social**: Siga outros usuários e veja seus personagens
- 🎯 **Limite para Anônimos**: Usuários não logados têm limite de 20 mensagens

## 🛠️ Tecnologias

- **Node.js** + **Express.js**
- **PostgreSQL**
- **OpenAI API** (GPT-4o-mini)
- **JWT** para autenticação
- **CORS** habilitado

## 📦 Instalação

### Pré-requisitos

- Node.js (versão LTS recomendada)
- PostgreSQL instalado e configurado
- Chaves da API OpenAI

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/richardmoraessouza/api-personia.git
cd api-personia/backend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

Para desenvolvimento com auto-reload:
```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000` (ou na porta definida no `.env`).

## 📚 Documentação da API

### Base URL

**Produção:**
```
https://api-personia.onrender.com
```

**Desenvolvimento Local:**
```
http://localhost:3000
```

### Autenticação

Alguns endpoints requerem autenticação via JWT. Para autenticar, inclua o token no header:

```
Authorization: Bearer <seu_token_jwt>
```

---

## 🔐 Autenticação e Usuários

### `POST /cadastra`
Cadastra um novo usuário.

**Autenticação:** Não requer  
**Campos Obrigatórios:** `nome`, `gmail`  
**Campos Opcionais:** `foto_perfil`, `descricao`

**Request Body:**
```json
{
  "nome": "João Silva",
  "gmail": "joao@example.com",
  "foto_perfil": "https://example.com/foto.jpg",
  "descricao": "Descrição do perfil"
}
```

**Response (201):**
```json
{
  "mensagem": "Cadastro realizado!",
  "id": 1,
  "nome": "João Silva",
  "gmail": "joao@example.com"
}
```

**Erros:**
- `400`: Campos obrigatórios ausentes ou inválidos
- `500`: Erro interno do servidor

### `POST /entrar`
Realiza login e retorna token JWT.

**Autenticação:** Não requer  
**Campos Obrigatórios:** `gmail`

**Request Body:**
```json
{
  "gmail": "joao@example.com"
}
```

**Response (200):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "gmail": "joao@example.com",
  "foto_perfil": "https://example.com/foto.jpg",
  "descricao": "Descrição do perfil",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erros:**
- `400`: Gmail não fornecido
- `404`: Usuário não encontrado
- `500`: Erro interno do servidor

### `GET /usuario/:id`
Busca dados do próprio usuário (requer autenticação).

**Autenticação:** Requer (JWT)  
**Parâmetros:** `id` (ID do usuário)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "foto_perfil": "https://example.com/foto.jpg",
  "descricao": "Descrição do perfil"
}
```

**Erros:**
- `401`: Token inválido ou ausente
- `404`: Usuário não encontrado
- `500`: Erro interno do servidor

### `GET /buscarUsuario/:gmail`
Busca usuário pelo Gmail.

**Autenticação:** Não requer  
**Parâmetros:** `gmail` (endereço de email do usuário)

**Response (200):**
```json
{
  "gmail": "joao@example.com",
  "nome": "João Silva",
  "foto_perfil": "https://example.com/foto.jpg"
}
```

**Erros:**
- `404`: Usuário não encontrado
- `500`: Erro interno do servidor

### `PUT /editar/:id`
Edita perfil do usuário (requer autenticação).

**Autenticação:** Requer (JWT)  
**Parâmetros:** `id` (ID do usuário)  
**Campos Opcionais:** `nome`, `foto_perfil`, `descricao`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "nome": "João Silva Atualizado",
  "foto_perfil": "https://example.com/nova-foto.jpg",
  "descricao": "Nova descrição"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Perfil atualizado com sucesso!",
  "usuario_atualizado": {
    "id": 1,
    "nome": "João Silva Atualizado",
    "gmail": "joao@example.com",
    "foto_perfil": "https://example.com/nova-foto.jpg",
    "descricao": "Nova descrição"
  }
}
```

**Erros:**
- `401`: Token inválido ou ausente
- `404`: Usuário não encontrado
- `500`: Erro interno do servidor

### `GET /perfil/:id`
Busca perfil de outro usuário.

**Autenticação:** Não requer  
**Parâmetros:** `id` (ID do usuário)

**Response (200):**
```json
{
  "nome": "Maria Santos",
  "foto_perfil": "https://example.com/foto.jpg",
  "descricao": "Descrição do perfil"
}
```

**Erros:**
- `404`: Usuário não encontrado
- `500`: Erro interno do servidor

---

## 🎭 Personagens

### `GET /personagens`
Lista todos os personagens disponíveis.

**Autenticação:** Não requer  

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Sherlock Holmes",
    "fotoia": "https://example.com/sherlock.jpg"
  },
  {
    "id": 2,
    "nome": "Personagem Personalizado",
    "fotoia": "https://example.com/personagem.jpg"
  }
]
```

**Erros:**
- `500`: Erro interno do servidor

### `GET /personagens/:id`
Busca detalhes de um personagem específico.

**Autenticação:** Não requer  
**Parâmetros:** `id` (ID do personagem)

**Response (200):**
```json
{
  "id": 1,
  "nome": "Sherlock Holmes",
  "fotoia": "https://example.com/sherlock.jpg",
  "descricao": "Detetive famoso",
  "usuario_id": 5
}
```

**Erros:**
- `404`: Personagem não encontrado
- `500`: Erro interno do servidor

### `GET /dadosPersonagem/:id`
Busca todos os dados completos de um personagem.

**Autenticação:** Não requer  
**Parâmetros:** `id` (ID do personagem)

**Response (200):**
```json
{
  "success": true,
  "personagem": {
    "id": 1,
    "nome": "Sherlock Holmes",
    "obra": "Sherlock Holmes",
    "genero": "Masculino",
    "personalidade": "Analítico, observador...",
    "comportamento": "Metódico...",
    "estilo": "Formal",
    "historia": "História do personagem...",
    "regras": "Regras específicas...",
    "tipo_personagem": "ficcional",
    "fotoia": "https://example.com/sherlock.jpg",
    "descricao": "Detetive famoso",
    "usuario_id": 5
  }
}
```

**Erros:**
- `404`: Personagem não encontrado
- `500`: Erro interno do servidor

### `GET /buscarPerson/:usuarioId`
Busca todos os personagens criados por um usuário específico.

**Autenticação:** Não requer  
**Parâmetros:** `usuarioId` (ID do usuário)

**Response (200):**
```json
[
  {
    "id": 1,
    "nome": "Personagem 1",
    "fotoia": "https://example.com/foto1.jpg",
    "descricao": "Descrição",
    "tipo_personagem": "ficcional"
  },
  {
    "id": 2,
    "nome": "Personagem 2",
    "fotoia": "https://example.com/foto2.jpg",
    "descricao": "Descrição",
    "tipo_personagem": "person"
  }
]
```

**Erros:**
- `404`: Nenhum personagem encontrado
- `500`: Erro interno do servidor

### `POST /criacao`
Cria um novo personagem (requer autenticação).

**Autenticação:** Requer (JWT)  
**Campos Obrigatórios:** `nome`, `genero`, `personalidade`, `comportamento`, `estilo`, `historia`, `fotoia`, `regras`, `descricao`, `tipo_personagem`  
**Campos Opcionais:** `feitos`, `obra`, `figurinhas` (array limitado a 6 itens)

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "nome": "Meu Personagem",
  "genero": "Masculino",
  "personalidade": "Extrovertido, amigável",
  "comportamento": "Sempre positivo",
  "estilo": "Casual",
  "historia": "História do personagem...",
  "fotoia": "https://example.com/foto.jpg",
  "regras": "Regras específicas...",
  "descricao": "Descrição do personagem",
  "feitos": "Feitos do personagem",
  "obra": "Nome da obra (opcional para personagens fictícios)",
  "tipo_personagem": "person",
  "figurinhas": ["url1", "url2"]
}
```

**Response (201):**
```json
{
  "id": 10,
  "nome": "Meu Personagem",
  "genero": "Masculino",
  ...
}
```

**Erros:**
- `400`: Campos obrigatórios ausentes
- `401`: Token inválido
- `500`: Erro interno do servidor

### `PUT /editarPerson/:id`
Edita um personagem existente.

**Autenticação:** Não requer  
**Parâmetros:** `id` (ID do personagem)  
**Campos Opcionais:** Todos os campos do personagem

**Request Body:**
```json
{
  "nome": "Personagem Atualizado",
  "genero": "Feminino",
  "personalidade": "Nova personalidade",
  "comportamento": "Novo comportamento",
  "estilo": "Novo estilo",
  "historia": "Nova história",
  "fotoia": "https://example.com/nova-foto.jpg",
  "regras": "Novas regras",
  "descricao": "Nova descrição",
  "obra": "Nova obra",
  "tipo_personagem": "ficcional"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Personagem atualizado com sucesso!",
  "personagem_atualizado": {
    "id": 1,
    "nome": "Personagem Atualizado",
    ...
  }
}
```

**Erros:**
- `404`: Personagem não encontrado
- `500`: Erro interno do servidor

### `GET /nomeCriador/:id`
Busca o nome do criador de um personagem.

**Autenticação:** Não requer  
**Parâmetros:** `id` (ID do personagem)

**Response (200):**
```json
{
  "nome": "João Silva"
}
```

**Erros:**
- `404`: Personagem ou criador não encontrado
- `500`: Erro interno do servidor

---

## 💬 Chat

### `POST /chat/:personagemId`
Envia uma mensagem para um personagem e recebe resposta da IA.

**Autenticação:** Não requer  
**Parâmetros:** `personagemId` (ID do personagem)  
**Campos Obrigatórios:** `message`  
**Campos Opcionais:** `userId`, `anonId`

**Request Body:**
```json
{
  "message": "Olá, como você está?",
  "userId": 123,
  "anonId": "abc-123"
}
```

**Response (200):**
```json
{
  "reply": "Olá! Estou muito bem, obrigado por perguntar!"
}
```

**Limitações:**
- Usuários anônimos têm limite de 20 mensagens
- Após o limite, é necessário fazer login para continuar

**Códigos de Erro:**
- `400`: Mensagem vazia ou ID de personagem inválido
- `404`: Personagem não encontrado
- `429`: Limite de mensagens anônimas excedido
- `500`: Erro interno do servidor ou chaves de API indisponíveis

---

## 👥 Sistema Social

### `POST /seguir`
Segue um usuário.

**Autenticação:** Não requer  
**Campos Obrigatórios:** `seguidor_id`, `seguido_id`

**Request Body:**
```json
{
  "seguidor_id": 1,
  "seguido_id": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Agora você está seguindo este usuário!"
}
```

**Erros:**
- `400`: IDs inválidos
- `409`: Já seguindo este usuário
- `500`: Erro interno do servidor

### `POST /deixar-de-seguir`
Deixa de seguir um usuário.

**Autenticação:** Não requer  
**Campos Obrigatórios:** `seguidor_id`, `seguido_id`

**Request Body:**
```json
{
  "seguidor_id": 1,
  "seguido_id": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Você deixou de seguir este usuário."
}
```

**Erros:**
- `400`: IDs inválidos
- `404`: Relacionamento não encontrado
- `500`: Erro interno do servidor

### `GET /seguidores/:id`
Lista os seguidores de um usuário.

**Autenticação:** Não requer  
**Parâmetros:** `id` (ID do usuário)

**Response (200):**
```json
{
  "success": true,
  "seguidores": [
    {
      "id": 3,
      "nome": "Maria",
      "foto_perfil": "https://example.com/foto.jpg"
    },
    {
      "id": 5,
      "nome": "Pedro",
      "foto_perfil": "https://example.com/foto2.jpg"
    }
  ]
}
```

**Erros:**
- `500`: Erro interno do servidor

### `GET /seguindo/:id`
Lista os usuários que um usuário está seguindo.

**Autenticação:** Não requer  
**Parâmetros:** `id` (ID do usuário)

**Response (200):**
```json
{
  "success": true,
  "seguindo": [
    {
      "id": 2,
      "nome": "Ana",
      "foto_perfil": "https://example.com/foto.jpg"
    }
  ]
}
```

**Erros:**
- `500`: Erro interno do servidor

---

## 📝 Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado / Token inválido
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

---

## 🔒 Segurança

- Autenticação JWT para endpoints protegidos
- Validação de dados de entrada
- CORS configurado
- Limites de uso para usuários anônimos
- Rotação automática de chaves de API


---

## 🌍 Contato

- 💼 [LinkedIn](https://www.linkedin.com/in/richard-moraes-souza-998539338/)
- 🌐 [Portfólio](https://richardmoraes.netlify.app/)
- 📱 [WhatsApp](https://wa.me/5547999326217?text=Olá%20Richard%2C%20encontrei%20seu%20perfil%20no%20GitHub!)
- 📧 richardmoraessouza2006@gmail.com

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

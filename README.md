# PersonIA - API Backend

API RESTful para interação com personagens alimentados por Inteligência Artificial. Permite que usuários conversem com personagens fictícios ou personas personalizadas através de uma interface de chat inteligente.

## 🔗 Links

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

### `POST /entrar`
Realiza login e retorna token JWT.

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

### `GET /usuario/:id`
Busca dados do próprio usuário (requer autenticação).

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

### `GET /buscarUsuario/:gmail`
Busca usuário pelo Gmail.

**Response (200):**
```json
{
  "gmail": "joao@example.com",
  "nome": "João Silva",
  "foto_perfil": "https://example.com/foto.jpg"
}
```

### `PUT /editar/:id`
Edita perfil do usuário (requer autenticação).

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

### `GET /perfil/:id`
Busca perfil de outro usuário.

**Response (200):**
```json
{
  "nome": "Maria Santos",
  "foto_perfil": "https://example.com/foto.jpg",
  "descricao": "Descrição do perfil"
}
```

---

## 🎭 Personagens

### `GET /personagens`
Lista todos os personagens disponíveis.

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

### `GET /personagens/:id`
Busca detalhes de um personagem específico.

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

### `GET /dadosPersonagem/:id`
Busca todos os dados completos de um personagem.

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

### `GET /buscarPerson/:usuarioId`
Busca todos os personagens criados por um usuário específico.

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

### `POST /criacao`
Cria um novo personagem (requer autenticação).

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
  "tipo_personagem": "person"
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

### `PUT /editarPerson/:id`
Edita um personagem existente.

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

### `GET /nomeCriador/:id`
Busca o nome do criador de um personagem.

**Response (200):**
```json
{
  "nome": "João Silva"
}
```

---

## 💬 Chat

### `POST /chat/:personagemId`
Envia uma mensagem para um personagem e recebe resposta da IA.

**Request Body:**
```json
{
  "message": "Olá, como você está?",
  "userId": 123,
  "anonId": "abc-123"
}
```

**Parâmetros:**
- `message` (obrigatório): Mensagem a ser enviada
- `userId` (opcional): ID do usuário logado
- `anonId` (opcional): ID anônimo para usuários não logados

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
- `500`: Erro interno do servidor ou chaves de API indisponíveis

---

## 👥 Sistema Social

### `POST /seguir`
Segue um usuário.

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

### `POST /deixar-de-seguir`
Deixa de seguir um usuário.

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

### `GET /seguidores/:id`
Lista os seguidores de um usuário.

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

### `GET /seguindo/:id`
Lista os usuários que um usuário está seguindo.

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

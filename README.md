# Chatback — Backend da plataforma Eikon

Chatback é o backend modular da plataforma Eikon, responsável por autenticação, gerenciamento de usuários, personagens, chat com IA, sistema social, descoberta, avaliações, missões e integração com serviços externos. O projeto foi estruturado para combinar funcionalidade de produto com boas práticas de segurança, organização e escalabilidade.

## Visão do projeto

Este backend suporta uma plataforma de experiência conversacional com IA, oferecendo uma camada robusta para:

- autenticação e autorização;
- persistência de dados e regras de negócio;
- integração com modelos de linguagem e serviços de armazenamento;
- operação segura em produção com cache, rate limiting e proteção de headers.

Para recrutadores, o projeto demonstra um backend com foco em produto real, arquitetura modular e atenção a segurança e operação.

## Principais capacidades

- autenticação com JWT e fluxo de usuários;
- cadastro e gestão de personagens;
- chat com IA e orquestração de prompts;
- sistema social, descoberta e interação entre usuários;
- avaliações, missões e mecanismos de engajamento;
- integração com Redis, PostgreSQL, Supabase e APIs de IA.

## Stack técnica

- Node.js + Express
- JavaScript ES modules
- PostgreSQL
- Redis
- Supabase Storage
- OpenAI / Google GenAI
- Swagger para documentação da API
- Docker Compose para ambiente local

## Arquitetura

O projeto foi organizado em módulos por domínio, como:

- auth
- users
- characters
- chat
- social
- discovery
- ratings
- missions
- cookies

Essa estrutura facilita manutenção, evolução e compreensão do sistema por novos desenvolvedores.

## Segurança e operação

O backend incorpora camadas de segurança importantes, como:

- Helmet para headers HTTP;
- CORS configurado;
- CSRF protection;
- rate limiting;
- sanitização e proteção de cookies;
- cache distribuído com Redis.

Esses pontos mostram maturidade para ambientes reais e para projetos com exigência de confiabilidade.

## Como rodar localmente

### Pré-requisitos

- Node.js
- Docker e Docker Compose
- variáveis de ambiente configuradas

### Opção 1 — com Docker

```bash
cd chatback
docker-compose up -d
```

### Opção 2 — modo local

```bash
cd chatback/backend
npm install
npm run dev
```

O backend ficará disponível em:

```text
http://localhost:3001
```

## Destaques para recrutadores

- backend preparado para produto completo e não apenas para protótipo;
- arquitetura modular e organizada;
- integração com IA, banco de dados, cache e armazenamento;
- foco em segurança, escalabilidade e experiência de operação.

## Objetivo do projeto

Demonstrar capacidade de construir uma API robusta, segura e bem estruturada para uma aplicação de IA com forte componente de produto, dados e integração com serviços externos.
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

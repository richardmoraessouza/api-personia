 # API Backend do Chatback
 
 Esta API fornece um serviço de backend para interagir com personagens alimentados por IA, permitindo que os usuários conversem com entidades fictícias ou personas gerais de IA. Ela utiliza a API da OpenAI para gerar respostas e gerencia o histórico de conversas, as definições dos personagens e a rotação de chaves de API.
 
 ## 🚀 Funcionalidades
 
 *   **Interação com Personagens via IA**: Converse com personagens definidos em um banco de dados PostgreSQL.
 *   **Dois Tipos de Personagem**:
     *   **Personagens Fictícios**: A persona da IA é criada com base no nome, obra, personalidade, história e regras de um personagem fictício específico.
     *   **Personas Gerais**: A persona da IA é construída em torno de uma "pessoa" geral com estilo, gênero, história, comportamento e personalidade definidos.
 *   **Rotação de Chaves da API OpenAI**: Alterna automaticamente entre várias chaves da API OpenAI para lidar com limites de taxa e falhas. As chaves são reativadas a cada 5 minutos.
 *   **Gerenciamento de Histórico de Chat**: Mantém um histórico de chat de curto prazo para cada interação usuário-personagem para fornecer contexto à IA.
 *   **Limites para Usuários Anônimos**: Implementa um limite de 20 mensagens para usuários anônimos para incentivar o login.
 *   **Geração Dinâmica de Prompts**: Constrói prompts de sistema detalhados para a IA com base nos atributos do personagem armazenados no banco de dados.
 
 ## 🛠️ Tecnologias Utilizadas
 
 *   **Node.js**: Ambiente de execução JavaScript.
 *   **Express.js**: Framework de aplicação web para Node.js.
 *   **API da OpenAI**: Para processamento de linguagem natural e geração de respostas de IA.
 *   **PostgreSQL**: Banco de dados relacional para armazenar dados dos personagens.
 *   **`dotenv`**: Para gerenciar variáveis de ambiente.
 
 ## ⚙️ Configuração
 
 Siga estes passos para colocar o projeto em funcionamento na sua máquina local.
 
 ### Pré-requisitos
 
 *   Node.js (versão LTS recomendada)
 *   Banco de dados PostgreSQL
 *   Chaves da API da OpenAI (pelo menos uma, mas várias são recomendadas para a rotação)
 
 ### Instalação
 
 1.  **Clone o repositório:**
     ```bash
     git clone <repository-url>
     cd chatback/backend
     ```
 2.  **Instale as dependências:**
     ```bash
     npm install
     ```
 3.  **Crie um arquivo `.env`:**
     No diretório `backend`, crie um arquivo chamado `.env` e adicione suas variáveis de ambiente.
 
     ```
     DATABASE_URL="postgresql://user:password@host:port/database"
     OPENAI_API_KEY="sua_chave_openai_1"
     OPENAI_API_KEY2="sua_chave_openai_2"
     OPENAI_API_KEY3="sua_chave_openai_3"
     OPENAI_API_KEY4="sua_chave_openai_4"
     OPENAI_API_KEY5="sua_chave_openai_5"
     # Adicione mais chaves conforme necessário, seguindo o padrão OPENAI_API_KEY[N]
     ```
     *Substitua os valores pelos dados de conexão do seu banco de dados e suas chaves da API da OpenAI.*
 
 ### Configuração do Banco de Dados
 
 Garanta que seu banco de dados PostgreSQL tenha um schema chamado `personia2` e uma tabela chamada `personagens` com a seguinte estrutura (ou similar):
 
 ```sql
 CREATE SCHEMA IF NOT EXISTS personia2;
 
 CREATE TABLE personia2.personagens (
     id SERIAL PRIMARY KEY,
     nome VARCHAR(255) NOT NULL,
     obra VARCHAR(255), -- Relevante para personagens fictícios
     genero VARCHAR(50),
     personalidade TEXT,
     comportamento TEXT,
     estilo TEXT,
     historia TEXT,
     regras TEXT,
     tipo_personagem VARCHAR(50) NOT NULL -- 'ficcional' ou 'person'
 );
 ```
 
 Populate this table with your desired character data.
 
 ### Running the Server
 
 ```bash
 npm start
 ```
 The server will typically run on `http://localhost:3000` (or the port defined in your Express app).
 
 ## 🚀 API Endpoints
 
 ### `POST /chat/:personagemId`
 
 Sends a message to a specific AI character and receives a response.
 
 *   **URL:** `/chat/:personagemId`
 *   **Method:** `POST`
 *   **URL Parameters:**
     *   `personagemId` (Integer): The ID of the character to chat with.
 *   **Request Body (JSON):**
     ```json
     {
       "message": "Olá, como você está?",
       "userId": 123,      // Optional: User ID for logged-in users
       "anonId": "abc-123" // Optional: Anonymous ID for non-logged-in users (if userId is not provided)
     }
     ```
 *   **Success Response (200 OK):**
     ```json
     {
       "reply": "Estou bem, obrigado por perguntar!"
     }
     ```
 *   **Error Responses:**
     *   `400 Bad Request`: If `message` is empty or `personagemId` is invalid.
     *   `404 Not Found`: If the character with the given `personagemId` does not exist.
     *   `500 Internal Server Error`: For other server-side errors or if no OpenAI API key is available.
 
 
 Contributions are welcome! Please feel free to submit pull requests or open issues.
 
📄 Licença
  
Este projeto está licenciado sob a Licença MIT.

## 🌍 Contato

- 💼 [LinkedIn](https://www.linkedin.com/in/richard-moraes-souza-998539338/)
- 🌐 [Portfólio](https://richardmoraes.netlify.app/)
- 📱 [WhatsApp](https://wa.me/5547999326217?text=Olá%20Richard%2C%20encontrei%20seu%20perfil%20no%20GitHub!)
- 📧 richardmoraessouza2006@gmail.com



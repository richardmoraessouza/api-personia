/**
 * @openapi
 * tags:
 *   - name: Characters
 *     description: Gestão de personagens, personagens fictícios e dados de perfil do personagem.
 */

/**
 * @swagger
 * /character/user-search-by-id/{usuarioId}:
 *   get:
 *     summary: Buscar personagens por ID do usuário
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Lista de personagens do usuário
 *       '400':
 *         description: ID de usuário inválido
 */

/**
 * @swagger
 * /character/search-character:
 *   get:
 *     summary: Buscar personagem por nome
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: query
 *         name: nome
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Personagem encontrado
 *       '400':
 *         description: Parâmetro de busca inválido
 */

/**
 * @swagger
 * /character/explore:
 *   get:
 *     summary: Buscar personagens para explorar
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número da página (opcional)
 *     responses:
 *       '200':
 *         description: Lista de personagens (metade populares + metade novos)
 */

/**
 * @swagger
 * /character/data-character-by-id/{id}:
 *   get:
 *     summary: Buscar personagem por ID
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Personagem encontrado
 *         content:
 *           application/json:
 *             example:
 *               id: 45
 *               nome: Naruto
 *               bio: Ninja da folha
 *       '400':
 *         description: ID inválido
 *       '404':
 *         description: Personagem não encontrado
 */

/**
 * @swagger
 * /character/data-character-by-public-id/{publicId}:
 *   get:
 *     summary: Buscar personagem por public_id
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Personagem encontrado
 *         content:
 *           application/json:
 *             example:
 *               id: 45
 *               nome: Naruto
 *               bio: Ninja da folha
 *               public_id: abc123xyz
 *       '400':
 *         description: publicId inválido
 *       '404':
 *         description: Personagem não encontrado
 */

/**
 * @swagger
 * /character/update-character/{id}:
 *   put:
 *     summary: Atualizar personagem (Requer autenticação)
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nome: Naruto Uzumaki
 *             bio: Hokage da aldeia da folha
 *             imagem: url_da_imagem
 *     responses:
 *       '200':
 *         description: Personagem atualizado com sucesso
 *       '400':
 *         description: Dados inválidos
 *       '401':
 *         description: Não autorizado
 *       '403':
 *         description: Sem permissão para editar este personagem
 */

/**
 * @swagger
 * /character/update-visibility/{publicId}:
 *   patch:
 *     summary: Atualizar visibilidade do personagem (Público/Privado) - Requer autenticação
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_public
 *             properties:
 *               is_public:
 *                 type: boolean
 *                 description: Define se o bot será público (true) ou privado (false)
 *           example:
 *             is_public: false
 *     responses:
 *       '200':
 *         description: Visibilidade atualizada com sucesso
 *       '400':
 *         description: O campo is_public deve ser um booleano válido
 *       '401':
 *         description: Não autorizado
 *       '404':
 *         description: Personagem não encontrado
 */

/**
 * @swagger
 * /character/create-character/{usuarioId}:
 *   post:
 *     summary: Criar novo personagem (Requer autenticação)
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nome: Novo Personagem
 *             bio: Descrição do personagem
 *             imagem: url_da_imagem
 *     responses:
 *       '201':
 *         description: Personagem criado com sucesso
 *       '400':
 *         description: Dados inválidos
 *       '401':
 *         description: Não autorizado
 */

/**
 * @swagger
 * /character/recent-characters/{usuarioId}/{personagemId}:
 *   post:
 *     summary: Salvar personagem recente
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: personagemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '201':
 *         description: Personagem salvo no histórico recente
 *       '400':
 *         description: IDs inválidos
 */

/**
 * @swagger
 * /character/get-recent-characters/{usuarioId}:
 *   get:
 *     summary: Obter últimos 10 personagens visitados
 *     tags:
 *       - Characters
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Lista dos últimos 10 personagens
 *       '400':
 *         description: ID de usuário inválido
 */

/**
 * @swagger
 * /character/character-views/{id}:
 *   get:
 *     summary: Obter histórico de visualizações do personagem (Requer autenticação)
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Histórico de visualizações
 *       '401':
 *         description: Não autorizado
 *       '404':
 *         description: Personagem não encontrado
 */

/**
 * @swagger
 * /character/increment-chat-views/{id}:
 *   post:
 *     summary: Incrementar contador de visualizações (Requer autenticação)
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Visualização incrementada
 *       '400':
 *         description: ID inválido
 *       '401':
 *         description: Não autorizado
 */

/**
 * @swagger
 * /character/increment-chat-views-public/{publicId}:
 *   post:
 *     summary: Incrementar contador de visualizações por public_id (Requer autenticação)
 *     tags:
 *       - Characters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Visualização incrementada
 *       '400':
 *         description: publicId inválido
 *       '401':
 *         description: Não autorizado
 *       '404':
 *         description: Personagem não encontrado
 */

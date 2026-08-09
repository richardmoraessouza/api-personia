/**
 * @openapi
 * tags:
 *   - name: Social
 *     description: Funcionalidades sociais, seguidores, perfis e interação entre usuários.
 */

/**
 * @swagger
 * /social/favorites/{usuario_id}/{personagem_id}:
 *   post:
 *     summary: Alternar favorito (adicionar ou remover)
 *     tags:
 *       - Social
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: personagem_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Favorito adicionado ou removido com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /social/favorites-by-user/{usuario_id}:
 *   get:
 *     summary: Listar personagens favoritos do usuário
 *     tags:
 *       - Social
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de personagens favoritos
 *       400:
 *         description: ID de usuário inválido
 */

/**
 * @swagger
 * /social/toggle-like/{usuario_id}/{personagem_id}:
 *   post:
 *     summary: Alternar like (adicionar ou remover)
 *     tags:
 *       - Social
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: personagem_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Like adicionado ou removido com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /social/likes-quantity/{personagem_id}:
 *   get:
 *     summary: Obter quantidade de likes de um personagem
 *     tags:
 *       - Social
 *     parameters:
 *       - in: path
 *         name: personagem_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Quantidade de likes retornada com sucesso
 *         content:
 *           application/json:
 *             example:
 *               likes_count: 42
 *       400:
 *         description: ID de personagem inválido
 */

/**
 * @swagger
 * /social/likes-by-user/{usuario_id}:
 *   get:
 *     summary: Obter likes dados pelo usuário (Requer autenticação)
 *     tags:
 *       - Social
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuario_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de personagens que o usuário deu like
 *       401:
 *         description: Não autorizado
 *       400:
 *         description: ID de usuário inválido
 */

/**
 * @swagger
 * /social/follow:
 *   post:
 *     summary: Seguir um usuário (Requer autenticação)
 *     tags:
 *       - Social
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id_seguindo:
 *                 type: integer
 *                 description: ID do usuário a ser seguido
 *           example:
 *             usuario_id_seguindo: 5
 *     responses:
 *       200:
 *         description: Usuário seguido com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /social/unfollow:
 *   delete:
 *     summary: Deixar de seguir um usuário (Requer autenticação)
 *     tags:
 *       - Social
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuario_id_deixar_seguir:
 *                 type: integer
 *                 description: ID do usuário a deixar de seguir
 *           example:
 *             usuario_id_deixar_seguir: 5
 *     responses:
 *       200:
 *         description: Deixou de seguir com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */

/**
 * @swagger
 * /social/users/{id}/followers:
 *   get:
 *     summary: Listar seguidores de um usuário
 *     tags:
 *       - Social
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de seguidores
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Usuário não encontrado
 */

/**
 * @swagger
 * /social/users/{id}/following:
 *   get:
 *     summary: Listar usuários que este usuário está seguindo
 *     tags:
 *       - Social
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de usuários seguidos
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Usuário não encontrado
 */

import { Router } from "express";
import { getFavoritesUser, toggleFavorites } from "../controllers/favoritesController.js";
import { toggleLike, getLikesCount, getLikesByUsuario } from "../controllers/likeController.js";
import { followUser, unfollowUser, listFollowers, listFollowing } from "../controllers/followersController.js";
import { verifyToken } from "../../../middleware/verifyToken.js";
import { socialLimiter } from "../../../middleware/rateLimiter.js";
import { 
  validateSocialAction, 
  validatePersonagemId, 
  validateUsuarioIdParam,
  validateIdParam 
} from "../../../middleware/inputValidators.js";

const router = Router();

// Apply rate limiter to all POST/DELETE routes
router.use(socialLimiter);

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
// Route to toggle favorite (add or remove)
router.post('/favorites/:usuario_id/:personagem_id', verifyToken, validateSocialAction, toggleFavorites);

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
// Route to list user's favorite characters
router.get('/favorites-by-user/:usuario_id', validateUsuarioIdParam, getFavoritesUser);

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
// Route to toggle like (add or remove)
router.post('/toggle-like/:usuario_id/:personagem_id', verifyToken, validateSocialAction, toggleLike);

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
// Route to show the quantity of likes for a character
router.get('/likes-quantity/:personagem_id', validatePersonagemId, getLikesCount);

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
// Route to show likes that the user has given (requires authentication)
router.get('/likes-by-user/:usuario_id', verifyToken, validateUsuarioIdParam, getLikesByUsuario);

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
// Route to follow a user
router.post('/follow', verifyToken, followUser);

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
// Route to unfollow a user
router.delete('/unfollow', verifyToken, unfollowUser);

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
// Route to list followers
router.get('/users/:id/followers', validateIdParam, listFollowers);

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
// Route to list following users
router.get('/users/:id/following', validateIdParam, listFollowing);

export default router;
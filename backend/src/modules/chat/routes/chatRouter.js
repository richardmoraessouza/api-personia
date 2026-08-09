import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { saveTime, getTime } from '../controllers/chatController.js';
import { verifyToken } from '../../../middleware/verifyToken.js';
import { optionalVerifyToken } from '../../../middleware/optionalVerifyToken.js';
import { chatLimiter } from '../../../middleware/rateLimiter.js';
import { validateChatMessage, validateCharacterId } from '../../../middleware/inputValidators.js';

const router = Router();

/**
 * @swagger
 * /chat/chat/{personagemId}:
 *   post:
 *     summary: Conversar com um personagem IA
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personagemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do personagem
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             message: "Olá Naruto"
 *             replyToId: 123
 *     responses:
 *       200:
 *         description: Resposta gerada pela IA
 *       400:
 *         description: Mensagem inválida
 *       404:
 *         description: Personagem ou mensagem referenciada não encontrada
 *       503:
 *         description: Serviço de IA indisponível
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/chat/:personagemId', optionalVerifyToken, chatLimiter, validateChatMessage, chatController.chatComPersonagem);

/**
 * @swagger
 * /chat/chat/{personagemId}/historico:
 *   get:
 *     summary: Buscar histórico da conversa
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personagemId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Histórico carregado
 */
router.get('/chat/:personagemId/historico', optionalVerifyToken, chatController.getHistoricoChat);

/**
 * @swagger
 * /chat/chat/{personagemId}/message/{messageId}:
 *   get:
 *     summary: Buscar mensagem específica
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personagemId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mensagem encontrada
 *       404:
 *         description: Mensagem não encontrada
 */
router.get('/chat/:personagemId/message/:messageId', optionalVerifyToken, chatController.getMessageById);

/**
 * @swagger
 * /chat/{personagemId}/limpar:
 *   delete:
 *     summary: Limpar memória da conversa
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: personagemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Memória limpa com sucesso
 *       500:
 *         description: Erro interno
 */
router.delete('/:personagemId/limpar', optionalVerifyToken, validateCharacterId, chatController.limparMemoria);

/**
 * @swagger
 * /chat/{userId}/{characterId}/history:
 *   get:
 *     summary: Buscar histórico por usuário e personagem
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Histórico encontrado
 */
router.get('/:userId/:characterId/history', optionalVerifyToken, chatController.getHistory);

/**
 * @swagger
 * /chat/{userId}/{characterId}/messages:
 *   post:
 *     summary: Salvar mensagem manualmente
 *     tags:
 *       - Chat
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             role: user
 *             content: Olá
 *             replyToId: 10
 *     responses:
 *       201:
 *         description: Mensagem criada
 *       400:
 *         description: Dados inválidos
 */
router.post('/:userId/:characterId/messages', optionalVerifyToken, chatController.createMessage);

/**
 * @swagger
 * /chat/messages/{id}:
 *   delete:
 *     summary: Excluir mensagem
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mensagem removida
 *       404:
 *         description: Mensagem não encontrada
 */
router.delete('/messages/:id', optionalVerifyToken, chatController.deleteMessage);

/**
 * @swagger
 * /chat/messages/{id}/pin:
 *   patch:
 *     summary: Fixar ou desafixar mensagem
 *     tags:
 *       - Chat
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
 *             isPinned: true
 *     responses:
 *       200:
 *         description: Mensagem atualizada
 */
router.patch('/messages/:id/pin', optionalVerifyToken, chatController.togglePinMessage);

/**
 * @swagger
 * /chat/chats/{chatId}/pinned:
 *   get:
 *     summary: Listar mensagens fixadas
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de mensagens fixadas
 */
router.get('/chats/:chatId/pinned', optionalVerifyToken, chatController.getPinnedMessages);


/**
 * @swagger
 * /api/conversation-time:
 *   post:
 *     summary: Save elapsed conversation time
 *     tags: [ConversationTime]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - characterId
 *               - seconds
 *             properties:
 *               characterId:
 *                 type: integer
 *                 example: 42
 *               seconds:
 *                 type: integer
 *                 example: 300
 *     responses:
 *       200:
 *         description: Time saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total_seconds:
 *                   type: integer
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/conversation-time', verifyToken, saveTime);

/**
 * @swagger
 * /api/conversation-time/{characterId}:
 *   get:
 *     summary: Get total conversation time with a character
 *     tags: [ConversationTime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: characterId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Character ID
 *     responses:
 *       200:
 *         description: Total time in seconds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_seconds:
 *                   type: integer
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/conversation-time/:characterId', verifyToken, getTime);

/**
 * @swagger
 * /chat/{publicId}/mensagens:
 *   delete:
 *     summary: Limpar toda a conversa com o personagem (apaga todas as mensagens)
 *     tags:
 *       - Chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *         description: Public ID do personagem
 *     responses:
 *       200:
 *         description: Conversa limpa com sucesso
 *       404:
 *         description: Personagem não encontrado
 *       500:
 *         description: Erro interno
 */
router.delete('/:publicId/mensagens', optionalVerifyToken, chatController.clearChatHistory);

export default router;
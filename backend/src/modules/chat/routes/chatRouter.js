import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { verifyToken } from '../../../middleware/verifyToken.js';
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
router.post('/chat/:personagemId', verifyToken, chatLimiter, validateChatMessage, chatController.chatComPersonagem);

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
router.get('/chat/:personagemId/historico', verifyToken, chatController.getHistoricoChat);

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
router.get('/chat/:personagemId/message/:messageId', verifyToken, chatController.getMessageById);

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
router.delete('/:personagemId/limpar', verifyToken, validateCharacterId, chatController.limparMemoria);

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
router.get('/:userId/:characterId/history', chatController.getHistory);

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
router.post('/:userId/:characterId/messages', chatController.createMessage);

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
router.delete('/messages/:id', verifyToken, chatController.deleteMessage);

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
router.patch('/messages/:id/pin', verifyToken, chatController.togglePinMessage);

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
router.get('/chats/:chatId/pinned', verifyToken, chatController.getPinnedMessages);

export default router;
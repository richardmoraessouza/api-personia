import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { saveTime, getTime } from '../controllers/chatController.js';
import { verifyToken } from '../../../middleware/verifyToken.js';
import { optionalVerifyToken } from '../../../middleware/optionalVerifyToken.js';
import { chatLimiter } from '../../../middleware/rateLimiter.js';
import { validateChatMessage, validateCharacterId } from '../../../middleware/inputValidators.js';

const router = Router();

router.post('/chat/:personagemId', optionalVerifyToken, chatLimiter, validateChatMessage, chatController.chatComPersonagem);

router.get('/chat/:personagemId/historico', optionalVerifyToken, chatController.getHistoricoChat);

router.get('/chat/:personagemId/message/:messageId', optionalVerifyToken, chatController.getMessageById);

router.delete('/:personagemId/limpar', optionalVerifyToken, validateCharacterId, chatController.limparMemoria);

router.get('/:userId/:characterId/history', optionalVerifyToken, chatController.getHistory);

router.post('/:userId/:characterId/messages', optionalVerifyToken, chatController.createMessage);

router.delete('/messages/:id', optionalVerifyToken, chatController.deleteMessage);

router.patch('/messages/:id/pin', optionalVerifyToken, chatController.togglePinMessage);

router.get('/chats/:chatId/pinned', optionalVerifyToken, chatController.getPinnedMessages);

router.post('/conversation-time', optionalVerifyToken, saveTime);

router.get('/conversation-time/:characterId', optionalVerifyToken, getTime);

router.delete('/:publicId/mensagens', optionalVerifyToken, chatController.clearChatHistory);

export default router;

import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { verifyToken } from '../../../middleware/verifyToken.js';
import { chatLimiter } from '../../../middleware/rateLimiter.js';
import { validateChatMessage, validateCharacterId } from '../../../middleware/inputValidators.js';

const router = Router();

/**
 * POST /chat_ia/:personagemId
 * Chat with character
 * ✅ PROTEGIDO: Rate limiting para prevenir DoS e custos excessivos
 */
router.post('/chat/:personagemId', chatLimiter, validateChatMessage, chatController.chatComPersonagem);

/**
 * GET /chat_ia/:personagemId/historico
 * Search chat history
 */
router.get('/:personagemId/historico', validateCharacterId, chatController.getHistoricoChat);

/**
 * DELETE /chat_ia/:personagemId/clear
 * Clear history cache (requires authentication)
 */
router.delete('/:personagemId/limpar', verifyToken, validateCharacterId, chatController.limparMemoria);

export default router;

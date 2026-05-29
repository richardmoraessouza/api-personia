import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { verifyToken } from '../../../middleware/verifyToken.js';

const router = Router();

/**
 * POST /chat_ia/:personagemId
 * Chat with character
 */
router.post('/:personagemId', chatController.chatComPersonagem);

/**
 * GET /chat_ia/:personagemId/historico
 * Search chat history
router.get('/:personagemId/historico', chatController.getHistoricoChat);

/**
 * DELETE /chat_ia/:personagemId/clear
 * Clear history cache (requires authentication)
 */
router.delete('/:personagemId/limpar', verifyToken, chatController.limparMemoria);

export default router;

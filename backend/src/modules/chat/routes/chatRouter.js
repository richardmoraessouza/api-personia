import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { verifyToken } from '../../../middleware/verifyToken.js';

const router = Router();

/**
 * POST /chat_ia/:personagemId
 * Chat com personagem
 */
router.post('/:personagemId', chatController.chatComPersonagem);

/**
 * GET /chat_ia/:personagemId/historico
 * Busca histórico de chat
 */
router.get('/:personagemId/historico', chatController.getHistoricoChat);

/**
 * DELETE /chat_ia/:personagemId/limpar
 * Limpa histórico em cache (requer autenticação)
 */
router.delete('/:personagemId/limpar', verifyToken, chatController.limparMemoria);

export default router;

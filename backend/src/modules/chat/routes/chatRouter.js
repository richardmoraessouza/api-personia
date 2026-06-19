import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { verifyToken } from '../../../middleware/verifyToken.js';
import { chatLimiter } from '../../../middleware/rateLimiter.js';
import { validateChatMessage, validateCharacterId } from '../../../middleware/inputValidators.js';

const router = Router();

/**
 * @route   POST /api/chats/chat/:personagemId
 * @desc    Main interaction endpoint to chat with an AI character
 * @desc    Request body: { message: string, replyToId?: number }
 * @desc    replyToId (optional): References a specific message for quote/reply functionality
 * @access  Public / Protected (Rate limited to prevent cost and DoS spikes)
 */
router.post('/chat/:personagemId', verifyToken, chatLimiter, validateChatMessage, chatController.chatComPersonagem);

/**
 * @route   GET /api/chats/chat/:personagemId/historico
 * @desc    Retrieve paginated chat messages for a character conversation session
 * @desc    Query params: limit (default: 30), offset (default: 0)
 * @desc    Response includes reply_to_id field for message quote context
 * @access  Public / Protected
 */
router.get('/chat/:personagemId/historico', verifyToken, chatController.getHistoricoChat);

/**
 * @route   GET /api/chats/chat/:personagemId/message/:messageId
 * @desc    Retrieve a single message by ID (used for quote/reply population)
 * @desc    Response includes full message with reply_to_id reference
 * @access  Public / Protected
 */
router.get('/chat/:personagemId/message/:messageId', verifyToken, chatController.getMessageById);

/**
 * @route   DELETE /api/chats/:personagemId/limpar
 * @desc    Clear/invalidate the conversation session context and cache
 * @access  Private (Requires valid JWT token and validated ID parameters)
 */
router.delete('/:personagemId/limpar', verifyToken, validateCharacterId, chatController.limparMemoria);

/**
 * @route   GET /api/chats/:userId/:characterId/history
 * @desc    Administrative direct HTTP handler to fetch recent messages by user and character IDs
 * @access  Internal / Protected
 */
router.get('/:userId/:characterId/history', chatController.getHistory);

/**
 * @route   POST /api/chats/:userId/:characterId/messages
 * @desc    Directly append a single message without triggering AI completion
 * @desc    Request body: { role: 'user'|'model', content: string, replyToId?: number }
 * @access  Internal / Protected
 */
router.post('/:userId/:characterId/messages', chatController.createMessage);

/**
 * @route   DELETE /api/chats/messages/:id
 * @desc    Delete a specific message by ID
 * @desc    Related messages with reply_to_id pointing to this message will have that reference nullified
 * @access  Private / Protected
 */
router.delete('/messages/:id', verifyToken, chatController.deleteMessage);

/**
 * @route   PATCH /api/chats/messages/:id/pin
 * @desc    Pin or unpin a message by toggling its visibility flag
 * @desc    Request body: { isPinned: boolean }
 * @access  Private / Protected
 */
router.patch('/messages/:id/pin', verifyToken, chatController.togglePinMessage);

/**
 * @route   GET /api/chats/chats/:chatId/pinned
 * @desc    Get all pinned messages from a specific chat room
 * @desc    Response includes reply_to_id for quote reconstruction on UI
 * @access  Private / Protected
 */
router.get('/chats/:chatId/pinned', verifyToken, chatController.getPinnedMessages);

export default router;
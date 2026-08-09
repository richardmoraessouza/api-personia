import * as chatService from '../services/chatService.js';

/**
 * POST /api/conversation-time
 * Save elapsed session time for a user+character pair
 */
const resolveAuthenticatedUserId = async (req) => {
  if (req.user?.id) {
    return req.user.id;
  }

  const rawAnonymousKey = req.headers?.['x-anon-id'] ?? req.headers?.['x-guest-id'] ?? req.cookies?.anonId ?? req.query?.anonId ?? req.body?.anonId;
  const anonymousKey = Array.isArray(rawAnonymousKey) ? rawAnonymousKey[0] : rawAnonymousKey;

  if (!anonymousKey) {
    return null;
  }

  return chatService.ensureAnonymousUserId(anonymousKey);
};

export const saveTime = async (req, res) => {
  try {
    const { characterId, seconds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (!characterId || !seconds) {
      return res.status(400).json({ error: 'characterId and seconds are required' });
    }

    const record = await chatService.saveConversationTime(userId, characterId, Number(seconds));
    return res.status(200).json({ success: true, total_seconds: record.total_seconds });
  } catch (err) {
    console.error('[saveTime]', err);
    if (err.message === 'Character not found') {
      return res.status(404).json({ error: 'Personagem não encontrado.' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/conversation-time/:characterId
 * Get total conversation time for a user+character pair
 */
export const getTime = async (req, res) => {
  try {
    const { characterId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const record = await chatService.fetchConversationTime(userId, characterId);
    return res.status(200).json(record);
  } catch (err) {
    console.error('[getTime]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
/**
 * @route   POST /api/chats/:personagemId
 * @desc    Send a message to a character, request completion from Gemini, and save history
 * @desc    Supports replying to specific messages by including replyToId in the request body
 * @access  Public / Protected (Supports anonymous users as 'anon')
 * @body    { message: string, replyToId?: number }
 */
export const chatComPersonagem = async (req, res) => {
  const { personagemId } = req.params;
  const { message, replyToId, isVoiceCall } = req.body;
  const userId = await resolveAuthenticatedUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const response = await chatService.chatComPersonagemService(
      userId,
      personagemId,
      message,
      replyToId || null,
      Boolean(isVoiceCall)
    );
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error inside chatComPersonagem controller:', err);
    const errMsg = err.message || '';

    // Specialized error handling matching service business rules
    if (errMsg.includes('Character not found')) {
      return res.status(404).json({ message: 'Personagem não encontrado.' });
    }
    if (errMsg.includes('Referenced message not found')) {
      return res.status(404).json({ message: 'Mensagem referenciada não encontrada.' });
    }
    if (errMsg.includes('Mensagem vazia') || errMsg.includes('INVALID_PARAMETERS')) {
      return res.status(400).json({ message: errMsg });
    }
    if (errMsg.includes('API key') || errMsg.includes('Gemini key')) {
      return res.status(503).json({ message: 'Serviço de IA indisponível no momento.' });
    }

    return res.status(500).json({ message: errMsg || 'Erro interno no servidor' });
  }
};

/**
 * @route   GET /api/chats/:personagemId/historico
 * @desc    Fetch paginated messages from a conversation session
 * @desc    Returns last 30 messages by default, supports offset for older messages
 * @desc    Includes reply_to_id field for quote context reconstruction
 * @access  Public / Protected
 * @query   { limit?: number, offset?: number }
 */
export const getHistoricoChat = async (req, res) => {
  const { personagemId } = req.params;
  
  // Extract pagination parameters from query strings, casting them to numbers
  const limit = req.query.limit ? Number(req.query.limit) : 30;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  
  const userId = await resolveAuthenticatedUserId(req);

  try {
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Pass the parameters to the service layer - personagemId stays as string
    const history = await chatService.loadConversationService(
      userId, 
      personagemId,
      limit,
      offset
    );
    
    return res.status(200).json(history);
  } catch (err) {
    console.error('Error fetching paginated chat history:', err);
    if (err.message === 'Character not found') {
      return res.status(404).json({ error: 'Personagem não encontrado.' });
    }
    if (err.message === 'INVALID_PARAMETERS') {
      return res.status(400).json({ error: 'Parâmetros inválidos.' });
    }
    return res.status(500).json({ error: 'Erro ao carregar mensagens.' });
  }
};

/**
 * @route   GET /api/chats/chat/:personagemId/message/:messageId
 * @desc    Fetch a single message by ID (used for quote/reply population)
 * @desc    Returns the full message including reply_to_id reference
 * @access  Public / Protected
 */
export const getMessageById = async (req, res) => {
  const { messageId } = req.params;
  const authenticatedUserId = await resolveAuthenticatedUserId(req);

  if (!authenticatedUserId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const message = await chatService.getMessageByIdService(Number(messageId), authenticatedUserId);
    
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }

    return res.status(200).json(message);
  } catch (err) {
    console.error('Error fetching message by ID:', err);

    if (err.message === 'INVALID_MESSAGE_ID' || err.message === 'INVALID_USER_ID') {
      return res.status(400).json({ error: 'ID de mensagem inválido.' });
    }

    return res.status(500).json({ error: 'Erro ao carregar mensagem.' });
  }
};

/**
 * @route   DELETE /api/chats/:personagemId/clear
 * @desc    Clear/invalidate the current chat session cache in Redis
 * @access  Protected
 */
export const limparMemoria = async (req, res) => {
  const { personagemId } = req.params;
  const userId = await resolveAuthenticatedUserId(req) || 'anon';

  try {
    await chatService.limparMemoriaService(userId, personajeId);
    return res.status(200).json({
      success: true,
      message: 'Memory cleared successfully'
    });
  } catch (err) {
    console.error('Error executing limparMemoria:', err);
    return res.status(500).json({
      error: 'Error clearing memory'
    });
  }
};

/**
 * @route   GET /api/chats/:userId/:characterId/history
 * @desc    Administrative/Direct HTTP handler to fetch recent messages explicitly by IDs
 * @access  Internal / Protected
 */
export const getHistory = async (req, res) => {
  try {
    const { userId, characterId } = req.params;
    const authenticatedUserId = await resolveAuthenticatedUserId(req);

    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (Number(userId) !== authenticatedUserId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const history = await chatService.loadConversationService(authenticatedUserId, Number(characterId));
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error executing getHistory:', error);
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
};

/**
 * @route   POST /api/chats/:userId/:characterId/messages
 * @desc    Directly append a single message line without triggering Gemini completion
 * @desc    Supports optional reply_to_id to establish message quote relationships
 * @access  Internal / Protected
 * @body    { role: 'user'|'model', content: string, replyToId?: number }
 */
export const createMessage = async (req, res) => {
  try {
    const { userId, characterId } = req.params;
    const { role, content, replyToId } = req.body; // Extract replyToId for message linking
    const authenticatedUserId = await resolveAuthenticatedUserId(req);

    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    if (Number(userId) !== authenticatedUserId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Forward the reply context parameters to the backend service
    const savedMessage = await chatService.sendMessageService(
      authenticatedUserId,
      Number(characterId),
      role,
      content,
      replyToId || null
    );

    return res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error executing createMessage:', error);
    if (error.message === 'ROLE_AND_CONTENT_REQUIRED') {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
};

/**
 * @route   DELETE /api/chats/messages/:id
 * @desc    Delete a specific message by its unique ID
 * @desc    Cascades delete: any messages replying to this message will have reply_to_id set to NULL
 * @access  Private / Protected
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = await resolveAuthenticatedUserId(req);

    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Pass the ID to the service layer for database deletion
    const resultado = await chatService.deleteMessageService(Number(id), authenticatedUserId);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('[Backend Error] Erro ao deletar mensagem:', error);

    if (error.message === 'MESSAGE_NOT_FOUND') {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }

    if (error.message === 'INVALID_MESSAGE_ID' || error.message === 'INVALID_USER_ID') {
      return res.status(400).json({ error: 'ID de mensagem inválido.' });
    }

    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

/**
 * @route   PATCH /api/chats/messages/:id/pin
 * @desc    Pin or unpin a message by ID
 * @desc    Pinned messages are highlighted and kept accessible separately from history
 * @access  Private / Protected
 * @body    { isPinned: boolean }
 */
export const togglePinMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;
    const authenticatedUserId = await resolveAuthenticatedUserId(req);

    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Update the pin status in the database
    const msgAtualizada = await chatService.togglePinMessageService(Number(id), isPinned, authenticatedUserId);

    return res.status(200).json(msgAtualizada);
  } catch (error) {
    console.error('[Backend Error] Erro ao alterar pin da mensagem:', error);

    if (error.message === 'INVALID_MESSAGE_ID' || error.message === 'INVALID_USER_ID') {
      return res.status(400).json({ error: 'ID de mensagem inválido.' });
    }

    return res.status(500).json({ error: error.message });
  }
};

/**
 * @route   GET /api/chats/chats/:chatId/pinned
 * @desc    Get all pinned messages from a specific chat room
 * @desc    Returns messages with reply_to_id for quote reconstruction
 * @access  Private / Protected
 */
export const getPinnedMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const authenticatedUserId = await resolveAuthenticatedUserId(req);

    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const pinnedMessages = await chatService.getChatPinnedMessages(chatId, authenticatedUserId);
    return res.status(200).json(pinnedMessages);
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
};

export const clearChatHistory = async (req, res) => {
  const usuarioId = await resolveAuthenticatedUserId(req);
  const { publicId } = req.params;

  if (!usuarioId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }


  console.log(publicId, usuarioId);
  try {
    const clearChat = await chatService.clearChatHistoryService(usuarioId, publicId)
    return res.status(200).json({ sucesso: true, mensagensApagadas: clearChat });

  } catch (error) {
    console.error('[Backend Error] Erro ao limpar histórico do chat:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}
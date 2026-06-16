import * as chatService from '../services/chatService.js';

/**
 * POST /chat/:personagemId
 * chat with character
 */
export const chatComPersonagem = async (req, res) => {
  const { personagemId } = req.params;
  const { message } = req.body;
  const userId = req.user?.id || req.userId || 'anon';


  try {
    const response = await chatService.chatComPersonagemService(userId, personagemId, message);
    return res.status(200).json(response);

  } catch (err) {
    console.error('Erro no chat:', err);
    const errMsg = err.message || '';

    if (errMsg.includes('Character not found')) {
      return res.status(404).json({ message: 'Personagem não encontrado.' });
    }
    if (errMsg.includes('Mensagem vazia')) {
      return res.status(400).json({ message: errMsg });
    }
    if (errMsg.includes('API key') || errMsg.includes('Gemini key')) {
      return res.status(503).json({ message: 'Serviço de IA indisponível no momento.' });
    }

    return res.status(500).json({ message: errMsg || 'Erro interno no servidor' });
  }
};

/**
 * GET /chat/:personagemId/historico
 * Search chat history (requires authentication, but returns empty list for anonymous users)
 */
export const getHistoricoChat = async (req, res) => {
  const { personagemId } = req.params;
  const userId = req.user?.id || req.userId;

  try {
    if (!userId) {
      // Anonymous user returns empty list
      return res.status(200).json([]);
    }

    const historico = await chatService.getHistoricoChatService(userId, personagemId);
    return res.status(200).json(historico);

  } catch (err) {
    console.error('Error searching history:', err);
    return res.status(500).json({ error: 'Erro ao carregar mensagens.' });
  }
};

/**
 * DELETE /chat/:personagemId/clear
 * clean history cache (requires authentication)
 */
export const limparMemoria = async (req, res) => {
  const { personagemId } = req.params;
  const userId = req.user?.id || req.userId || 'anon';

  try {
    await chatService.limparMemoriaService(userId, personagemId);
    return res.status(200).json({
      success: true,
      message: 'Memory cleared successfully'
    });

  } catch (err) {
    console.error('Error clearing memory:', err);
    return res.status(500).json({
      error: 'Error clearing memory'
    });
  }
};

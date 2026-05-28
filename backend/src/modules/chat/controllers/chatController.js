import * as chatService from '../services/chatService.js';

/**
 * POST /chat/:personagemId
 * Chat com personagem
 */
export const chatComPersonagem = async (req, res) => {
  const { personagemId } = req.params;
  const { message } = req.body;
  const userId = req.user?.id || req.userId || 'anon';

  try {
    const response = await chatService.chatComPersonagemService(userId, personagemId, message);
    return res.status(200).json(response);

  } catch (err) {
    console.error('Erro em chatComPersonagem:', err);

    const message = err?.message || '';

    // Mensagens de erro específicas
    if (message.includes('Nenhuma Gemini API key configurada') ||
        message.includes('Nenhuma chave Gemini')) {
      return res.status(503).json({
        reply: "Erro: Gemini API key não configurada no servidor."
      });
    }

    if (message.includes('API key') || message.includes('API_KEY')) {
      return res.status(503).json({
        reply: "Erro: problema com a Gemini API key no servidor."
      });
    }

    if (message.includes('Personagem não encontrado')) {
      return res.status(404).json({
        reply: "Personagem não encontrado"
      });
    }

    if (message.includes('Mensagem vazia')) {
      return res.status(400).json({
        reply: "Mensagem vazia 😅"
      });
    }

    return res.status(500).json({
      reply: "Erro no chat com personagem 😢"
    });
  }
};

/**
 * GET /chat/:personagemId/historico
 * Busca histórico de chat
 */
export const getHistoricoChat = async (req, res) => {
  const { personagemId } = req.params;
  const userId = req.user?.id || req.userId;

  try {
    if (!userId) {
      // Usuário anônimo retorna lista vazia
      return res.status(200).json([]);
    }

    const historico = await chatService.getHistoricoChatService(userId, personagemId);
    return res.status(200).json(historico);

  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    return res.status(500).json({ error: 'Erro ao carregar mensagens.' });
  }
};

/**
 * DELETE /chat/:personagemId/limpar
 * Limpa histórico em cache
 */
export const limparMemoria = async (req, res) => {
  const { personagemId } = req.params;
  const userId = req.user?.id || req.userId || 'anon';

  try {
    await chatService.limparMemoriaService(userId, personagemId);
    return res.status(200).json({
      success: true,
      message: 'Memória limpa com sucesso'
    });

  } catch (err) {
    console.error('Erro ao limpar memória:', err);
    return res.status(500).json({
      error: 'Erro ao limpar memória'
    });
  }
};

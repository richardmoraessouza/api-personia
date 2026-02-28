import db from '../../db/db.js'
export const getHistoricoChat = async (req, res) => {
    const { personagemId } = req.params;
    const userId = req.user?.id || req.user?.userId || req.userId;

console.log("DEBUG: ID do usuário extraído:", userId);
  
    try {
      if (!userId) {
        return res.status(401).json({ error: "Usuário não identificado." });
      }
  
      const result = await db.query(
        `
        SELECT historico
        FROM personia2.conversas
        WHERE usuario_id = $1 AND personagem_id = $2
      `,
        [userId, personagemId]
      );
  
      // Se não houver conversa, retorna array vazio em vez de erro
      if (result.rows.length === 0) {
        return res.status(200).json([]);
      }
  
      // Retorna o array de mensagens salvo no JSONB
      return res.status(200).json(result.rows[0].historico);
  
    } catch (err) {
      console.error("Erro ao buscar histórico:", err);
      return res.status(500).json({ error: "Erro ao carregar mensagens." });
    }
  };
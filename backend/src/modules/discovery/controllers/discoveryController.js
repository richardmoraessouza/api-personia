import * as discoveryService from '../services/discoveryServices.js';

export const getPopularWeek = async (req, res) => {
    try {
        const popularWeek = await discoveryService.getPopularWeekService();
        return res.status(200).json(popularWeek);
    } catch (err) {
        console.error('Error loading popular characters of the week', err);
        return res.status(500).json({ error: 'Error loading popular characters of the week.' });
    }
}

// Search characters by tag slug with pagination
export const getFeed = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (!usuarioId || usuarioId === 'undefined' || isNaN(Number(usuarioId))) {
      return res.status(400).json({ message: "ID de usuário inválido enviado." });
    }

    const feed = await discoveryService.getRecommendationsService(Number(usuarioId)); 
    
    return res.status(200).json(feed);
  } catch (error) {
    console.error("ERRO CRÍTICO NO GETFEED:", error);
    return res.status(500).json({ 
      message: "Erro interno no servidor ao buscar feed", 
      error: error.message 
    });
  }
};
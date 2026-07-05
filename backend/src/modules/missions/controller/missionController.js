import * as missionService from '../services/missionService.js';

// Busca as 5 missões do dia ou gera novas caso não existam
export const getDailyMissions = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    if (!usuarioId || usuarioId === 'undefined' || isNaN(Number(usuarioId))) {
      return res.status(400).json({ message: "ID de usuário inválido enviado." });
    }

    const authenticatedUserId = Number(req.user?.id);
    if (!Number.isInteger(authenticatedUserId) || authenticatedUserId !== Number(usuarioId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const missions = await missionService.getDailyMissionsService(Number(usuarioId));
    return res.status(200).json(missions);
  } catch (error) {
    console.error("ERRO CRÍTICO NO GETDAILYMISSIONS:", error);
    return res.status(500).json({
      message: "Erro interno no servidor ao buscar missões diárias",
      error: error.message
    });
  }
};

// Claim a mission reward (server validates ownership, progress and awards XP)
export const claimMission = async (req, res) => {
  try {
    const { missionId } = req.params;
    const authenticatedUserId = Number(req.user?.id);

    if (!missionId || isNaN(Number(missionId))) {
      return res.status(400).json({ message: "Invalid mission ID." });
    }

    const usuarioId = authenticatedUserId;
    if (!Number.isInteger(usuarioId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const result = await missionService.claimMissionService(Number(usuarioId), Number(missionId));

    if (result.alreadyClaimed) {
      return res.status(200).json({ success: true, message: 'Mission already claimed.' });
    }

    return res.status(200).json({ success: true, xp_awarded: result.xpAwarded, updated: result.updated });
  } catch (error) {
    console.error('ERROR IN claimMission:', error);
    if (error.message === 'MISSÃO_NAO_ENCONTRADA') return res.status(404).json({ message: 'Mission not found for this user.' });
    if (error.message === 'MISSÃO_INCOMPLETA') return res.status(400).json({ message: 'Mission not complete yet.' });
    return res.status(500).json({ message: 'Internal server error while claiming mission', error: error.message });
  }
};
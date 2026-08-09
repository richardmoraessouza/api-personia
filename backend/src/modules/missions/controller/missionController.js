import { getDailyMissionsService, updateMissionProgressService, claimMissionService } from '../services/missionService.js';

export async function getDailyMissions(req, res, next) {
  try {
    const { usuarioId } = req.params;
    const data = getDailyMissionsService(usuarioId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function updateMissionProgress(req, res, next) {
  try {
    const { usuarioId, missionId, incremento } = req.body;
    const data = updateMissionProgressService(usuarioId, missionId, incremento);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function claimMission(req, res, next) {
  try {
    const { missionId } = req.params;
    const data = claimMissionService(missionId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

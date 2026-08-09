import * as repo from '../repositories/missionRepository.js';

export function getDailyMissionsService(usuarioId) {
  return repo.getDailyMissions(usuarioId);
}

export function updateMissionProgressService(usuarioId, missionId, incremento = 1) {
  const res = repo.incrementMissionProgress(usuarioId, missionId, incremento);
  if (!res) throw new Error('Mission not found');
  return res;
}

export function claimMissionService(missionId) {
  const res = repo.claimMission(missionId);
  if (res.error) {
    const err = new Error(res.error);
    err.status = 404;
    throw err;
  }
  return res;
}

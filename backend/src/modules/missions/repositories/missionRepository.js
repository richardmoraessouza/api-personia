const userMissions = new Map(); // usuarioId -> array of missions
let nextMissionId = 1000;

function makeMission(usuarioId, index) {
  const mission_id = nextMissionId++;
  const objetivo = 3 + (index % 3);
  return {
    id: mission_id,
    mission_id,
    usuario_id: usuarioId,
    progresso: 0,
    completada: false,
    coletada_em: null,
    data_atribuida: new Date().toISOString(),
    tipo: 'daily',
    titulo: `Missão diária ${index + 1}`,
    descricao: `Complete ${objetivo} ações para concluir esta missão.`,
    objetivo,
    xp: 10 * objetivo,
  };
}

export function getDailyMissions(usuarioId) {
  const uid = Number(usuarioId);
  if (!uid) return [];
  if (!userMissions.has(uid)) {
    const arr = Array.from({ length: 5 }, (_, i) => makeMission(uid, i));
    userMissions.set(uid, arr);
  }
  return userMissions.get(uid) || [];
}

export function incrementMissionProgress(usuarioId, missionId, incremento = 1) {
  const uid = Number(usuarioId);
  const missions = userMissions.get(uid) || [];
  const m = missions.find((mm) => mm.mission_id === Number(missionId));
  if (!m) return null;
  if (m.completada) return { completada: true, progresso: m.progresso, xpGanho: 0 };
  m.progresso = Math.min(m.objetivo, m.progresso + Number(incremento));
  if (m.progresso >= m.objetivo) m.completada = true;
  const xpGanho = m.completada ? m.xp : 0;
  return { completada: m.completada, progresso: m.progresso, xpGanho };
}

export function claimMission(missionId) {
  // find across all users
  for (const [uid, missions] of userMissions.entries()) {
    const m = missions.find((mm) => mm.mission_id === Number(missionId));
    if (m) {
      if (!m.completada) return { error: 'Mission not completed' };
      if (m.coletada_em) return { error: 'Already claimed' };
      m.coletada_em = new Date().toISOString();
      return { xp_awarded: m.xp, updated: m };
    }
  }
  return { error: 'Mission not found' };
}

import * as missionRepository from '../repositories/missionRepository.js';

// Gerencia a busca ou sorteio das 5 missões do dia
export const getDailyMissionsService = async (usuarioId) => {
  // 1. Verifica se já existem missões criadas para hoje
  let currentMissions = await missionRepository.findDailyMissionsByUserId(usuarioId);

  // Se o usuário já possuir as 5 missões do dia prontas, apenas retorna
  if (currentMissions && currentMissions.length === 5) {
    return currentMissions;
  }

  console.log(`\n🎲 [Missions] Gerando novas missões diárias para o usuarioId=${usuarioId}...`);

  // 2. Caso contrário, busca 5 missões aleatórias ativas da pool principal
  const randomPool = await missionRepository.findRandomActiveMissions(5);
  
  if (!randomPool || randomPool.length < 5) {
    throw new Error("Não há missões ativas suficientes cadastradas no sistema.");
  }

  // 3. Limpa qualquer inconsistência de hoje e vincula as novas missões sorteadas
  await missionRepository.deleteTodayMissions(usuarioId);
  
  const missionIds = randomPool.map(m => m.id);
  await missionRepository.saveDailyMissions(usuarioId, missionIds);

  // 4. Retorna a lista final devidamente estruturada
  return await missionRepository.findDailyMissionsByUserId(usuarioId);
};


// Claim a mission reward by missionId for a given user. Ensures server-side
// validation and atomic awarding of XP.
export const claimMissionService = async (usuarioId, missionId) => {
  return await missionRepository.claimUserMission(usuarioId, missionId);
};
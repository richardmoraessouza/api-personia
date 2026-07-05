import db from '../../../config/db.js';
import { updateXpAndLevel, updateXpAndLevelWithClient } from '../../users/repositories/userRepository.js';

// Busca as missões vinculadas ao usuário na última hora com as propriedades do catálogo
export const findDailyMissionsByUserId = async (usuarioId) => {
  const query = `
    SELECT um.id, um.mission_id, um.progresso, um.completada, um.coletada_em, um.data_atribuida,
           m.tipo, m.titulo, m.descricao, m.objetivo, m.xp
    FROM personia2.user_missions um
    JOIN personia2.mission m ON um.mission_id = m.id
    WHERE um.user_id = $1 AND um.data_atribuida >= NOW() - INTERVAL '5 hour';
  `;
  const result = await db.query(query, [usuarioId]);
  return result.rows;
};

// Sorteia missões ativas aleatoriamente da pool estática
export const findRandomActiveMissions = async (limit = 5) => {
  const query = `
    SELECT id FROM personia2.mission 
    WHERE ativa = TRUE 
    ORDER BY RANDOM() 
    LIMIT $1;
  `;
  const result = await db.query(query, [limit]);
  return result.rows;
};

// Remove as atribuições da última hora para evitar duplicações
export const deleteTodayMissions = async (usuarioId) => {
  const query = `
    DELETE FROM personia2.user_missions 
    WHERE user_id = $1 AND data_atribuida >= NOW() - INTERVAL '1 hour';
  `;
  await db.query(query, [usuarioId]);
};

// Insere em lote as missões sorteadas com timestamp completo
export const saveDailyMissions = async (usuarioId, missionIds) => {
  await Promise.all(missionIds.map(async (missionId) => {
    return db.query(`
      INSERT INTO personia2.user_missions (user_id, mission_id, data_atribuida)
      VALUES ($1, $2, NOW())
    `, [usuarioId, missionId]);
  }));
};

// Localiza uma missão específica do usuário na última hora
export const findUserMissionToday = async (usuarioId, missionId) => {
  const query = `
    SELECT um.*, m.titulo, m.objetivo, m.xp 
    FROM personia2.user_missions um
    JOIN personia2.mission m ON um.mission_id = m.id
    WHERE um.user_id = $1 AND um.mission_id = $2 AND um.data_atribuida >= NOW() - INTERVAL '1 hour';
  `;
  const result = await db.query(query, [usuarioId, missionId]);
  return result.rows[0] || null;
};

// Atualiza o progresso e o status de completada da linha intermediária
export const updateProgress = async (id, progresso, completada) => {
  const query = `
    UPDATE personia2.user_missions 
    SET progresso = $1, completada = $2 
    WHERE id = $3;
  `;
  await db.query(query, [progresso, completada, id]);
};

// Soma o XP ganho diretamente no perfil global do usuário
export const giveUserXp = async (usuarioId, xp) => {
  const updated = await updateXpAndLevel(usuarioId, xp);
  console.log(`💰 [XP] user=${usuarioId} recebeu +${xp} XP no banco`);
  return updated;
};

// Atomically claim a user's mission reward: verifies assignment, checks progress,
// marks mission as completed/collected and awards XP in a single transaction.
export const claimUserMission = async (usuarioId, missionId) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const query = `
      SELECT um.id, um.progresso, um.completada, um.coletada_em, m.objetivo, m.xp
      FROM personia2.user_missions um
      JOIN personia2.mission m ON um.mission_id = m.id
      WHERE um.user_id = $1 AND um.mission_id = $2 AND um.data_atribuida >= NOW() - INTERVAL '1 hour'
      FOR UPDATE
      LIMIT 1;
    `;

    const result = await client.query(query, [usuarioId, missionId]);
    const row = result.rows[0];

    if (!row) {
      await client.query('ROLLBACK');
      throw new Error('MISSÃO_NAO_ENCONTRADA');
    }

    if (row.coletada_em) {
      await client.query('COMMIT');
      return { alreadyClaimed: true };
    }

    if (row.progresso < row.objetivo) {
      await client.query('ROLLBACK');
      throw new Error('MISSÃO_INCOMPLETA');
    }

    await client.query(`
      UPDATE personia2.user_missions
      SET coletada_em = NOW()
      WHERE id = $1
    `, [row.id]);

    const xp = row.xp || 0;
    const updated = await updateXpAndLevelWithClient(client, usuarioId, xp);

    await client.query('COMMIT');

    return { alreadyClaimed: false, xpAwarded: xp, updated };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Rastreia o progresso de uma missão pelo tipo e recompensa o usuário ao completar
export const trackMissionProgress = async (usuarioId, tipo, increment = 1) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const query = `
      SELECT um.id, um.progresso, um.completada, m.objetivo, m.xp
      FROM personia2.user_missions um
      JOIN personia2.mission m ON um.mission_id = m.id
      WHERE um.user_id = $1
        AND m.tipo = $2
        AND um.data_atribuida >= NOW() - INTERVAL '1 hour'
        AND um.completada = FALSE
      ORDER BY um.id
      LIMIT 1
      FOR UPDATE;
    `;
    const result = await client.query(query, [usuarioId, tipo]);
    const mission = result.rows[0];

    console.log(`🔍 [MISSION] tipo=${tipo} | user=${usuarioId} | missão encontrada:`, mission ? `id=${mission.id} progresso=${mission.progresso}/${mission.objetivo}` : 'NENHUMA');

    if (!mission) {
      await client.query('COMMIT');
      return null;
    }

    const novoProgresso = mission.progresso + increment;
    const completada = novoProgresso >= mission.objetivo;

    await client.query(`
      UPDATE personia2.user_missions
      SET progresso = $1, completada = $2
      WHERE id = $3
    `, [novoProgresso, completada, mission.id]);

    console.log(`📈 [MISSION] tipo=${tipo} | user=${usuarioId} | progresso atualizado: ${mission.progresso} → ${novoProgresso}/${mission.objetivo} | completada: ${completada}`);

    let xpResult = null;
    if (completada) {
      xpResult = await updateXpAndLevel(usuarioId, mission.xp);
      console.log(`🏆 [MISSION] tipo=${tipo} | user=${usuarioId} completou a missão e recebeu +${mission.xp} XP`);
    }

    await client.query('COMMIT');

    return { completada, progresso: novoProgresso, objetivo: mission.objetivo, xp: xpResult };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
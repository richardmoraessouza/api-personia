import db from '../../../config/db.js';

// ============================
// FIND LIKE - Check if user liked a character
// ============================
export const findLike = async (usuarioId, personagemId) => {
  const result = await db.query(
    `SELECT * FROM personia2.likes WHERE usuario_id = $1 AND personagem_id = $2`,
    [usuarioId, personagemId]
  );
  return result.rows.length > 0;
};

// ============================
// CREATE LIKE - Add like from user to character
// ============================
export const createLike = async (usuarioId, personagemId) => {
  await db.query(
    `INSERT INTO personia2.likes (usuario_id, personagem_id) VALUES ($1, $2)`,
    [usuarioId, personagemId]
  );
};

// ============================
// REMOVE LIKE - Delete like from user to character
// ============================
export const removeLike = async (usuarioId, personagemId) => {
  await db.query(
    `DELETE FROM personia2.likes WHERE usuario_id = $1 AND personagem_id = $2`,
    [usuarioId, personagemId]
  );
};

// ============================
// COUNT LIKES BY CHARACTER - Get total likes for a character
// ============================
export const countLikesByPersonagem = async (personagemId) => {
  const result = await db.query(
    `SELECT COUNT(*) AS total_likes FROM personia2.likes WHERE personagem_id = $1`,
    [personagemId]
  );
  return parseInt(result.rows[0].total_likes, 10);
};

// ============================
// GET LIKES BY USER - Get all characters liked by user
// ============================
export const getLikesByUsuario = async (usuarioId) => {
  const result = await db.query(
    `SELECT personagem_id FROM personia2.likes WHERE usuario_id = $1`,
    [usuarioId]
  );
  return result.rows.map(r => r.personagem_id);
};
import db from '../../../config/db.js';

// SEARCH FAVORITES
export const findFavorites = async (userId, personId) => {
    const query = `
        SELECT * FROM personia2.favoritos
        WHERE usuario_id = $1 AND personagem_id = $2
    `;

    const result = await db.query(query, [userId, personId]);

    return result.rows[0] || null;
}

// REMOVE FAVORITE
export const removeFavorite = async (userId, personId) => {
    const result = await db.query(`
        DELETE FROM personia2.favoritos
        WHERE usuario_id = $1 AND personagem_id = $2
    `, [userId, personId]);
}

// ADD FAVORITE
export const addFavorite = async (userId, personId) => {
    const result = await db.query(`
        INSERT INTO personia2.favoritos (usuario_id, personagem_id)
        VALUES ($1, $2)
    `, [userId, personId]);
}

// LIST FAVORITES OF USER
export const findFavoritesUserByUser = async (
  usuarioId
) => {

  const query = `
    SELECT
      p.id,
      p.nome,
      p.fotoia,
      p.descricao,
      p.usuario_id
    FROM personia2.personagens p
    INNER JOIN personia2.favoritos f
      ON f.personagem_id = p.id
    WHERE f.usuario_id = $1
    ORDER BY p.nome
  `;

  const result = await db.query(query, [usuarioId]);

  return result.rows;
};


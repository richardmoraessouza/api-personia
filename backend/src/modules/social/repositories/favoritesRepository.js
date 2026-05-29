import db from '../../../config/db.js';

// Find favorite record by user and character
export const findFavorites = async (userId, personId) => {
    try {
        const query = `
            SELECT * FROM personia2.favoritos
            WHERE usuario_id = $1 AND personagem_id = $2
        `;
        const result = await db.query(query, [userId, personId]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('[findFavorites] Error searching for favorite:', error);
        throw error;
    }
}

// Remove favorite from user
export const removeFavorite = async (userId, personId) => {
    try {
        const result = await db.query(`
            DELETE FROM personia2.favoritos
            WHERE usuario_id = $1 AND personagem_id = $2
        `, [userId, personId]);
        return result;
    } catch (error) {
        console.error('[removeFavorite] Error removing favorite:', error);
        throw error;
    }
}

// Add favorite (handles conflicts - duplicate entries prevented)
export const addFavorite = async (userId, personId) => {
    try {
        // Uses upsert to prevent duplicate key error
        // If exists, do nothing; if not exists, insert
        const result = await db.query(`
            INSERT INTO personia2.favoritos (usuario_id, personagem_id)
            VALUES ($1, $2)
            ON CONFLICT (usuario_id, personagem_id)
            DO NOTHING
        `, [userId, personId]);
        return result;
    } catch (error) {
        console.error('[addFavorite] Error adding favorite:', error);
        throw error;
    }
}

// Get all favorites of user
export const findFavoritesUserByUser = async (
  usuarioId
) => {
  try {
    const query = `
      SELECT
        p.id,
        p.nome,
        p.fotoia,
        p.bio,
        p.usuario_id
      FROM personia2.personagens p
      INNER JOIN personia2.favoritos f
        ON f.personagem_id = p.id
      WHERE f.usuario_id = $1
      ORDER BY p.nome
    `;
    const result = await db.query(query, [usuarioId]);
    return result.rows;
  } catch (error) {
    console.error('[findFavoritesUserByUser] Error searching for favorites:', error);
    throw error;
  }
};



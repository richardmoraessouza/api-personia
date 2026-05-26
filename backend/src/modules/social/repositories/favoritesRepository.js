import db from '../../../config/db.js';

// SEARCH FAVORITES
export const findFavorites = async (userId, personId) => {
    try {
        const query = `
            SELECT * FROM personia2.favoritos
            WHERE usuario_id = $1 AND personagem_id = $2
        `;
        const result = await db.query(query, [userId, personId]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('[findFavorites] Erro ao procurar favorito:', error);
        throw error;
    }
}

// REMOVE FAVORITE
export const removeFavorite = async (userId, personId) => {
    try {
        const result = await db.query(`
            DELETE FROM personia2.favoritos
            WHERE usuario_id = $1 AND personagem_id = $2
        `, [userId, personId]);
        return result;
    } catch (error) {
        console.error('[removeFavorite] Erro ao remover favorito:', error);
        throw error;
    }
}

// ADD FAVORITE (com tratamento de conflito)
export const addFavorite = async (userId, personId) => {
    try {
        // USE upsert para evitar erro de duplicate key
        // Se já existe, faz DELETE; se não existe, faz INSERT
        const result = await db.query(`
            INSERT INTO personia2.favoritos (usuario_id, personagem_id)
            VALUES ($1, $2)
            ON CONFLICT (usuario_id, personagem_id)
            DO NOTHING
        `, [userId, personId]);
        return result;
    } catch (error) {
        console.error('[addFavorite] Erro ao adicionar favorito:', error);
        throw error;
    }
}

// LIST FAVORITES OF USER
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
    console.error('[findFavoritesUserByUser] Erro ao buscar favoritos:', error);
    throw error;
  }
};

// EXEMPLO: Como usar transactions para múltiplas operações
// import { withTransaction } from '../../../config/db.js';
// 
// export const bulkAddFavorites = async (userId, personIds) => {
//   return withTransaction(async (client) => {
//     for (const personId of personIds) {
//       await client.query(
//         `INSERT INTO personia2.favoritos (usuario_id, personagem_id)
//          VALUES ($1, $2)`,
//         [userId, personId]
//       );
//     }
//     return { success: true, count: personIds.length };
//   });
// };



import db from '../../../config/db.js';

// FOLLOW - Add follower relationship 
export async function insertFollower(seguidor_id, seguido_id) {
    return await db.query(
        `INSERT INTO personia2.seguidores (seguidor_id, seguido_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [seguidor_id, seguido_id]
    );
}

// Delete follower relationship
export async function deleteFollower(seguidor_id, seguido_id) {
    return await db.query(
        `DELETE FROM personia2.seguidores 
         WHERE seguidor_id = $1 AND seguido_id = $2`,
        [seguidor_id, seguido_id]
    );
}

// LIST FOLLOWERS - Get followers of a user (GET)
// Returns list of users following this user
export async function selectFollowers(usuario_id) {
    const result = await db.query(
        `SELECT u.id, u.nome, u.foto_perfil, u.frame
         FROM personia2.seguidores s
         JOIN personia2.usuarios u ON s.seguidor_id = u.id
         WHERE s.seguido_id = $1`,
        [usuario_id]
    );
    return result.rows;
}

// LIST FOLLOWING - Get users that a user is following (GET)
// Returns list of users that this user is following
export async function selectFollowing(usuario_id) {
    const result = await db.query(
        `SELECT u.id, u.nome, u.foto_perfil, u.frame
         FROM personia2.seguidores s
         JOIN personia2.usuarios u ON s.seguido_id = u.id
         WHERE s.seguidor_id = $1`,
        [usuario_id]
    );
    return result.rows;
}
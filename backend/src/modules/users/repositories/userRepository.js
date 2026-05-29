import db from '../../../config/db.js';

export const FindByid = async (id) => {
    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao
        FROM personia2.usuarios
        WHERE id = $1
        `, [id]);
    
    return result.rows[0];
}

// Search user by ID
export const findUserById = async (id) => {
    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao
        FROM personia2.usuarios WHERE id = $1
    `, [id]);
    return result.rows[0];
}

// Get user name by ID
export const findNameUserById = async (userId) => {
    const result = await db.query(`
        SELECT nome FROM personia2.usuarios WHERE id = $1
        `, [userId]);
    
    if (result.rows.length === 0) return null;

    return result.rows[0].nome;
}

// Get another user's public profile data
export const findDateOtherUserByid = async (id) => {
    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao
        FROM personia2.usuarios
        WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
}

// Update user profile information by ID
export const updateProfileUserById = async (id, {nome, foto_perfil, descricao}) => {
    const updateQuery = `
        UPDATE personia2.usuarios
        SET
            nome = COALESCE(NULLIF($1::text, ''), nome),
            foto_perfil = COALESCE($2::text, foto_perfil),
            descricao = COALESCE($3::text, descricao)
        WHERE id = $4
    `;

    await db.query(updateQuery, [nome, foto_perfil, descricao, id]);

    const selectQuery = `
        SELECT id, nome, foto_perfil, descricao
        FROM personia2.usuarios
        WHERE id = $1
    `;

    const result = await db.query(selectQuery, [id]);

    return result.rows[0] || null;
}

// Get another user's name by ID
export const findNameOtherUser = async (usuarioId) => {
    const id = parseInt(usuarioId, 10);
    
    if (isNaN(id)) {
        throw new Error('ID_INVALIDO');
    }

    const result = await db.query(
      `SELECT nome FROM personia2.usuarios WHERE id = $1`,
      [ id ]
    );

    if (!result.rows || result.rows.length === 0) {
        return { nome: null };
    }

    return {
        nome: result.rows[0].nome || null
    };
}
import db from '../../../config/db.js';

export const FindByid = async (id) => {
    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao
        FROM personia2.usuarios
        WHERE id = $1
        `, [id]);
    
    return result.rows[0];
}

export const findUserById = async (id) => {
    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao
        FROM personia2.usuarios WHERE id = $1
    `, [id]);
    return result.rows[0];
}

export const findNameUserById = async (userId) => {
    const result = await db.query(`
        SELECT nome FROM personia2.usuarios WHERE id = $1
        `, [userId]);
    
    if (result.rows.length === 0) return null;

    return result.rows[0].nome;
}

export const findDateOtherUserByid = async (id) => {
    const result = await db.query(`
        SELECT id, nome, foto_perfil, descricao
        FROM personia2.usuarios
        WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
}

// rota para editar o perfil do usuário
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

export const findNameOtherUser = async (usuarioId) => {
    const result = await db.query(
      `SELECT nome FROM personia2.usuarios WHERE id = $1`,
      [ usuarioId ]
    );

    return {
        nome: result.rows[0]?.nome || null
    };
}
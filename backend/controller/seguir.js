import db from '../db.js';

// 🧩 Seguir um usuário
export async function seguirUsuario(req, res) {
    const { seguidor_id, seguido_id } = req.body;

    if (seguidor_id === seguido_id) {
        return res.status(400).json({ success: false, error: "Você não pode seguir a si mesmo." });
    }

    try {
        await db.query(
            `INSERT INTO personia.seguir (seguidor_id, seguido_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [seguidor_id, seguido_id]
        );

        res.json({ success: true, message: "Agora você está seguindo este usuário!" });
    } catch (error) {
        console.error("Erro ao seguir usuário:", error);
        res.status(500).json({ success: false, error: "Erro interno ao seguir usuário." });
    }
}

// 🧩 Deixar de seguir
export async function deixarDeSeguir(req, res) {
    const { seguidor_id, seguido_id } = req.body;

    try {
        await db.query(
            `DELETE FROM personia.seguir WHERE seguidor_id = $1 AND seguido_id = $2`,
            [seguidor_id, seguido_id]
        );

        res.json({ success: true, message: "Você deixou de seguir este usuário." });
    } catch (error) {
        console.error("Erro ao deixar de seguir:", error);
        res.status(500).json({ success: false, error: "Erro interno ao deixar de seguir usuário." });
    }
}

// 👥 Listar seguidores de um usuário
export async function listarSeguidores(req, res) {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT u.id, u.nome, u.foto_perfil
             FROM personia.seguir s
             JOIN personia.usuarios u ON s.seguidor_id = u.id
             WHERE s.seguido_id = $1`,
            [id]
        );

        res.json({ success: true, seguidores: result.rows });
    } catch (error) {
        console.error("Erro ao listar seguidores:", error);
        res.status(500).json({ success: false, error: "Erro interno ao listar seguidores." });
    }
}

// ➡️ Listar quem o usuário está seguindo
export async function listarSeguindo(req, res) {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT u.id, u.nome, u.foto_perfil
             FROM personia.seguir s
             JOIN personia.usuarios u ON s.seguido_id = u.id
             WHERE s.seguidor_id = $1`,
            [id]
        );

        res.json({ success: true, seguindo: result.rows });
    } catch (error) {
        console.error("Erro ao listar seguindo:", error);
        res.status(500).json({ success: false, error: "Erro interno ao listar seguindo." });
    }
}
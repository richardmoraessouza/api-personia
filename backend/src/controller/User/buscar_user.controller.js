import db from '../../db/db.js';

// Busca o usuário pelo nome que usuário colocou na busca
export const buscarUser = async (req, res) => {
    const { nameUser } = req.query;

    if (!nameUser) {
        return res.status(400).json({ success: false, error: 'Erro interno ao buscar usuário' });
    }

    try {
        const termoBusca = `%${nameUser}%`;

        const result = await db.query(
            `SELECT id, nome FROM personia2.usuarios WHERE nome ILIKE $1`,
            [termoBusca]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Nenhum personagem encontrado com esse nome." 
            });
        }

        res.status(200).json({
            success: true,
            resultados: result.rows
        });
    } catch (err) {
        console.error("Erro ao buscar usuários", err);
        res.status(500).json({ err: "Erro ao buscar usuários" });
    }
};


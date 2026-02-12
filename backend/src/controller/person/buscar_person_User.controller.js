import db from '../../db/db.js';

// rota para buscar personagem do usuário
export const buscar = async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const result = await db.query(
            `SELECT id, nome, fotoia, bio, tipo_personagem 
             FROM personia2.personagens 
             WHERE usuario_id = $1`,
            [usuarioId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Personagem não encontrado" });
        }

        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Erro ao carregar personagens do usuário', err);
        res.status(500).json({ error: 'Erro ao carregar personagens do usuário', details: err.message });
    }
};

// Buscar personagem pelo ID do personagem
export const dadosPersonagem = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT * FROM personia2.personagens WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Personagem não encontrado." });
        }

        res.json({
            success: true,
            personagem: result.rows[0]
        });

    } catch (err) {
        console.error("Erro ao buscar o personagem:", err);
        res.status(500).json({ success: false, error: "Erro interno ao buscar personagem." });
    }
};

// Busca o personagem pelo nome que usuário colocou na busca
export const buscarPersonagem = async (req, res) => {
    const { nomePersonagem } = req.query;

    if (!nomePersonagem) {
        return res.status(400).json({ success: false, error: "O parâmetro nomePersonagem é obrigatório." });
    }

    try {
        // O % em volta do termo significa "qualquer coisa antes ou depois"
        const termoBusca = `%${nomePersonagem}%`;

        const result = await db.query(
            `SELECT id, nome, fotoia, bio, tipo_personagem 
             FROM personia2.personagens 
             WHERE nome ILIKE $1`, 
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
        console.error("Erro ao buscar personagem:", err);
        res.status(500).json({ 
            success: false, 
            error: "Erro interno ao buscar personagem." 
        });
    }
}
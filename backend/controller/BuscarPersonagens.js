import db from '../db.js'

// rota para buscar personagem do usuário
export const buscar = async (req, res) => {
    const { usuarioId } = req.params;

    try {
        const result = await db.query(
            `SELECT id, nome, fotoia, descricao, tipo_personagem 
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

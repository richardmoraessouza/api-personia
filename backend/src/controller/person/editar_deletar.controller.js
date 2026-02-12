import db from '../../db/db.js';

// Atualizar personagem
export const editaPerson = async (req, res) => {
    const { id } = req.params;
    const { nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, descricao, obra, tipo_personagem, figurinhas } = req.body;

    try {
        const result = await db.query(
            `UPDATE personia2.personagens
             SET nome = $1,
                 genero = $2,
                 personalidade = $3,
                 comportamento = $4,
                 estilo = $5,
                 historia = $6,
                 fotoia = $7,
                 regras = $8,
                 descricao = $9,
                 obra = $10,
                 tipo_personagem = $11,
                 figurinhas = $12
             WHERE id = $13
             RETURNING *`,
            [nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, descricao, obra, tipo_personagem, figurinhasFiltradas, id] // <--- aqui removi JSON.stringify
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Personagem não encontrado." });
        }

        const personagemAtualizado = result.rows[0];

        res.json({
            success: true,
            message: "Personagem atualizado com sucesso!",
            personagem_atualizado: personagemAtualizado
        });

    } catch (err) {
        console.error("Erro ao atualizar o personagem:", err);
        res.status(500).json({ success: false, error: "Erro interno ao atualizar personagem." });
    }
};

export const deletaPerson = async (req, res) => {
    const { id } = req.params 

    try {
        const result = await db.query(`
            DELETE FROM personia2.personagens WHERE id = $1 RETURNING *
            `, [ id ])

        if (result === 0) {
            return res.status(404).json({ message: 'Personagem não encontrado'})
        }
        
        return res.status(200).json({
            message: 'Personagem removido com sucesso',
            deleted: result.rows[0]
        });

    } catch (err) {
        console.error("Erro ao deletar personagem", err)
        return res.status(500).json({error: 'Erro ao deletar', details: err.message})
    }
} 
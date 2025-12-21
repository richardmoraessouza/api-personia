import db from '../db.js';

// Rota de editar perfil
export async function editarPerfil(req, res) {
    const { id } = req.params;
    const { nome, foto_perfil, descricao } = req.body;

    try {
        await db.query(
            "UPDATE personia2.usuarios SET nome = $1, foto_perfil = $2, descricao = $3 WHERE id = $4",
            [nome, foto_perfil, descricao, id]
        );
        
        const result = await db.query(
            "SELECT id, nome, gmail, foto_perfil, descricao FROM personia2.usuarios WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
             return res.status(404).json({ success: false, error: "Usuário atualizado, mas dados não encontrados." });
        }
        
        const usuarioAtualizado = result.rows[0];

        res.json({
            success: true,
            message: "Perfil atualizado com sucesso!",
            usuario_atualizado: usuarioAtualizado
        });

    } catch (error) {
        console.error("Erro no UPDATE ou SELECT do perfil:", error);
        res.status(500).json({ success: false, error: "Erro interno ao atualizar perfil." });
    }
}

// Buscar personagem pelo ID
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

// Atualizar personagem
export const editaPerson = async (req, res) => {
    const { id } = req.params;
    const { nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, descricao, obra, tipo_personagem, figurinhas } = req.body;

    // Remove valores vazios
    const figurinhasFiltradas = figurinhas.filter(f => f !== '');

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


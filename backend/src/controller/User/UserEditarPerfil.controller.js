import db from '../../db/db.js';

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

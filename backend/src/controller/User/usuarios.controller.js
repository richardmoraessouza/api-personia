import db from '../../db.js'
import dotenv from 'dotenv'

dotenv.config();

// buscar os dados da própria conta do usuário
export const getUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT id, nome, foto_perfil, descricao FROM personia2.usuarios
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const usuario = result.rows[0];
        res.status(200).json(usuario);

    } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        res.status(500).json({ error: 'Erro interno do servidor ao buscar perfil.' });
    }
};

// rota para mostra o nome do usuário para a ia
export const getNomeUsuario = async (userId) => {
    if (!userId) return null;
    try {
        const result = await db.query('SELECT nome FROM personia2.usuarios WHERE id = $1', [userId]);
        if (result.rows.length > 0) {
            return result.rows[0].nome;
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar nome do usuário:', error);
        return null;
    }
};

// mostra os dados do outro usuario
export const perfilOutroUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT nome, foto_perfil, descricao FROM personia2.usuarios WHERE id = $1`,
            [id]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({menssage: 'Usuário não encotrado'})
        }

        res.json(result.rows[0])
    } catch (err) {
        console.error('Erro ao carregar dados do usuário', err)
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
}

// rota para mostra o nome do criado do person
export const nomeCriador = async (req, res) => {
    const { id } = req.params

    try {
        const result = await db.query(`
            SELECT nome FROM personia2.usuarios WHERE id = $1
            `, [id])

            if (result.rows.length === 0) {
                return res.status(404).json({menssage: 'Usuário não encotrado'})
            }
        
            res.json(result.rows[0])
    } catch (err) {
        console.error("Erro ao carregar nome do usuário", err)
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
} 
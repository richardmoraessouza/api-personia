import db from '../db.js';

// rota de criar personagens
export const adicionarPerson = async (req, res) => {
    const { nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, descricao } = req.body;
    const usuarioId = req.user?.id; // agora pega do token

    if (!usuarioId) return res.status(401).json({ error: 'Usuário não autenticado' });

    try {
        const result = await db.query(
            `INSERT INTO personia.personagens 
             (nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, usuario_id, descricao)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, usuarioId, descricao]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar personagem:', err);
        res.status(500).json({ error: 'Erro ao adicionar personagem', details: err.message });
    }
};


// rota de mostrar os personagens no menu
export const personagens = async (req, res) => {
    try {
        const result = await db.query('SELECT id, nome, fotoia FROM personia.personagens');
        console.log('Resultado do DB:', result.rows); 
        res.status(200).json(result.rows); 
    } catch (err) {
        console.error('Erro ao buscar personagens completo:', err);
        res.status(500).json({ error: 'Erro ao buscar personagens', details: err.message || err });
    }
};


// rota de mostrar personagem pelo id
export const IdPersonagem = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            'SELECT id, nome, fotoia, descricao, usuario_id FROM personia.personagens WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Personagem não encontrado' });
        }

        res.status(200).json(result.rows[0]); 
    } catch (err) {
        console.error('Erro ao buscar personagem pelo ID:', err);
        res.status(500).json({ error: 'Erro ao buscar personagem', details: err.message });
    }
};

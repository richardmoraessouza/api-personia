import db from '../db.js';

// rota de criar personagens
export const adicionarPerson = async (req, res) => {
    const { nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, descricao, feitos, obra, tipo_personagem, figurinhas, bio } = req.body;
    const usuarioId = req.user?.id;

    if (!usuarioId) return res.status(401).json({ error: 'Usuário não autenticado' });

    try {
        // garante que figurinhas é um array e limita a 6
        const figurinhasFiltradas = Array.isArray(figurinhas)
            ? figurinhas.slice(0, 6)
            : [];

        const result = await db.query(
            `INSERT INTO personia2.personagens 
             (nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, usuario_id, descricao, feitos, obra, tipo_personagem, figurinhas, bio)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
             RETURNING *`,
            [nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, usuarioId, descricao, feitos, obra, tipo_personagem, figurinhasFiltradas, bio]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao adicionar personagem:', err);
        res.status(500).json({ error: 'Erro ao adicionar personagem', details: err.message });
    }
};

// rota de mostrar os personagens
export const personagens = async (req, res) => {
    try {
        const result = await db.query('SELECT id, nome, fotoia, tipo_personagem, usuario_id, bio FROM personia2.personagens');
        res.status(200).json(result.rows); 
    } catch (err) {
        console.error('Erro ao buscar personagens completo:', err);
        res.status(500).json({ error: 'Erro ao buscar personagens', details: err.message || err });
    }
};

// rota de mostrar personagem pelo idfigurinhas TEXT[] DEFAULT '{}'

export const IdPersonagem = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            'SELECT id, nome, fotoia, descricao, usuario_id FROM personia2.personagens WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Personagem não encontrado' });
        }

        res.status(200).json(result.rows[0]); 
    } catch (err) {
        console.error('Erro ao buscar personagem:', err);
        res.status(500).json({ error: 'Erro ao buscar personagem', details: err.message });
    }
};

import db from '../../db/db.js';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_padrao_muito_seguro';

export const adicionarUsuario = async (req, res) => {
    const { gmail, nome, imgPerfil } = req.body;

    try {
        
        const novoUsuario = await db.query(
            'INSERT INTO personia2.usuarios (gmail, nome, foto_perfil) VALUES ($1, $2, $3) RETURNING *',
            [gmail, nome, imgPerfil]
        );

        const user = novoUsuario.rows[0];

        const token = jwt.sign(
            { id: user.id, gmail: user.gmail }, 
            process.env.JWT_SECRET || 'seu_segredo_padrao_muito_seguro',
            { expiresIn: '24h' }
        );

        
        return res.status(201).json({
            token, 
            usuario: {
                id: user.id,
                nome: user.nome,
                gmail: user.gmail,
                foto_perfil: user.foto_perfil
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao cadastrar usuário" });
    }
};

// Login de usuário
export const loginUsuario = async (req, res) => {
  const { gmail } = req.body;

  try {
    const result = await db.query(
      `SELECT id, nome, gmail, foto_perfil, descricao FROM personia2.usuarios
       WHERE gmail = $1`,
      [gmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    const usuario = result.rows[0];
    // Token **sem expiração**
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      id: usuario.id,
      nome: usuario.nome,
      gmail: usuario.gmail,
      foto_perfil: usuario.foto_perfil,
      descricao: usuario.descricao,
      token: token
    });

  } catch (err) {
    console.error('Erro ao logar usuário:', err);
    res.status(500).json({ error: 'Erro ao logar usuário' });
  }
};

// Rota para buscar o gmail do usuario
export const buscarGmail = async (req, res) => {
  const { gmail } = req.params;  // Pegando da URL

  try {
    const result = await db.query(`
      SELECT gmail, nome, foto_perfil FROM personia2.usuarios WHERE gmail = $1
    `, [gmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.status(200).json(result.rows[0]);  // ← status correto para sucesso
  } catch (err) {
    console.error('Erro ao buscar o usuário', err);
    return res.status(500).json({ error: 'Erro ao buscar usuário', details: err.message });
  }
};

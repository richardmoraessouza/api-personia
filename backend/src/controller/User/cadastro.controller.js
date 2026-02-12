import db from '../../db/db.js';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_padrao_muito_seguro';

// Cadastro de usuário
export const adicionarUsuario = async (req, res) => {
  const { nome = null, gmail, foto_perfil = null, descricao = null } = req.body;

  try {

    const result = await db.query(
      `INSERT INTO personia2.usuarios 
        (nome, gmail, foto_perfil, descricao)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, gmail`,
      [nome, gmail, foto_perfil, descricao]
    );

    res.status(201).json({
      mensagem: 'Cadastro realizado!',
      id: result.rows[0].id,
      nome: result.rows[0].nome,
      gmail: result.rows[0].gmail,
    });

  } catch (err) {
    console.error('🔥 ERRO NO CADASTRO:', err);
    if (err.code === '23505' && err.constraint === 'usuarios_gmail_key') {
        return res.status(400).json({ error: 'Este Gmail já foi cadastrado!' });
    }

    res.status(500).json({ error: 'Erro ao adicionar usuário' });
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
      JWT_SECRET
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

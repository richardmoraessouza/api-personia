import db from '../db.js';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv'
import nodemailer from 'nodemailer';
import crypto from 'crypto';

dotenv.config();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_padrao_muito_seguro';

// Rota para enviar e-mail
const enviarEmailVerificacao = async (gmail, nome, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: gmail,
    subject: 'Confirme seu cadastro no Personia',
    html: `
      <p>Olá ${nome || ''},</p>
      <p>Obrigado por se cadastrar! Clique no link abaixo para cadastra sua conta:</p>
      <a href="https://persoia.netlify.app/confirmar-email?token=${token}">Confirmar e-mail</a>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Rota de cadastro
export const adicionarUsuario = async (req, res) => {
  const { nome = null, gmail, senha, foto_perfil = null, descricao = null } = req.body;

  try {
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const tokenVerificacao = crypto.randomBytes(32).toString('hex');

    const result = await db.query(
      `INSERT INTO personia.usuarios 
        (nome, gmail, senha, foto_perfil, descricao, token_verificacao)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nome, gmail`,
      [nome, gmail, senhaHash, foto_perfil, descricao, tokenVerificacao]
    );

    await enviarEmailVerificacao(gmail, nome, tokenVerificacao);

    res.status(201).json({
      mensagem: 'Cadastro realizado! Verifique seu e-mail para ativar a conta.',
      id: result.rows[0].id,
      nome: result.rows[0].nome,
      gmail: result.rows[0].gmail,
    });

  } catch (err) {
    console.error('Erro ao adicionar usuário:', err);
    res.status(500).json({ error: 'Erro ao adicionar usuário' });
  }
};

// Rota de confirmação de e-mail
export const confirmarEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).send("Token inválido.");

  try {
    const result = await db.query(
      `UPDATE personia.usuarios 
       SET email_verificado = TRUE, token_verificacao = NULL
       WHERE token_verificacao = $1
       RETURNING id, nome, gmail`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).send("Token inválido ou expirado.");
    }

    // 👉 Redireciona direto para o site
    return res.redirect('https://api-personia.onrender.com/entrar');

  } catch (err) {
    console.error("Erro ao confirmar e-mail:", err);
    res.status(500).send("Erro interno do servidor.");
  }
};

// Rota login
export const loginUsuario = async (req, res) => {
  const { gmail, senha } = req.body;

  try {
    const result = await db.query(
      `SELECT id, nome, gmail, senha, foto_perfil, descricao FROM personia.usuarios
       WHERE gmail = $1`,
      [gmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    const usuario = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome },
      JWT_SECRET,
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

// Rota para enviar o gmail para o usuário
const enviarEmailRecuperacao = async (gmail, nome, token,) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: gmail,
      subject: 'Redefinição de senha - Personia',
      html: `
        <p>Olá ${nome || ''},</p>
        <p>Você solicitou redefinição de senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="https://persoia.netlify.app/nova-senha?token=${token}">Redefinir senha</a>
        <p>Se você não solicitou, ignore este e-mail.</p>
      `,
    };
  
    await transporter.sendMail(mailOptions);
  };

// Rota verifica gmail para levar esqueci senha
export const esqueciSenha = async (req, res) => {
    const { gmail } = req.body;

    try {
        const result = await db.query(
        'SELECT id, nome FROM personia.usuarios WHERE gmail = $1',
        [gmail]
        );

        if (result.rows.length === 0) {
        return res.status(404).json({ error: 'E-mail não cadastrado' });
        }

        const usuario = result.rows[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiracao = new Date(Date.now() + 3600000); // 1 hora de validade

        await db.query(
        `UPDATE personia.usuarios
            SET token_reset_senha = $1, token_reset_expira = $2
            WHERE id = $3`,
        [token, expiracao, usuario.id]
        );

        await enviarEmailRecuperacao(gmail, usuario.nome, token);

        res.json({ mensagem: 'E-mail de recuperação enviado!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
    };

    export const validarTokenSenha = async (req, res) => {
    const { token } = req.query;

    try {
        const result = await db.query(
        `SELECT id FROM personia.usuarios 
            WHERE token_reset_senha = $1 AND token_reset_expira > NOW()`,
        [token]
        );

        if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Token inválido ou expirado' });
        }

        res.json({ mensagem: 'Token válido' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
  
// Rota para colocar nova senha
export const novaSenha = async (req, res) => {
    try {
        const { token, senha } = req.body;

        if (!token) return res.status(400).json({ error: 'Token não enviado' });
        if (!senha) return res.status(400).json({ error: 'Senha não enviada' });

        const result = await db.query(
        `SELECT id, token_reset_expira, NOW() as agora FROM personia.usuarios 
            WHERE token_reset_senha = $1`,
        [token]
        );

        if (result.rows.length === 0) {
        console.log('Token não encontrado no banco!');
        return res.status(400).json({ error: 'Token inválido ou expirado' });
        }

        // Verifica expiração
        const expiracao = new Date(result.rows[0].token_reset_expira);
        const agora = new Date(result.rows[0].agora);
        console.log('Expiração do token:', expiracao, 'Agora:', agora);

        if (expiracao <= agora) {
        return res.status(400).json({ error: 'Token expirado' });
        }

        const usuarioId = result.rows[0].id;
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

        await db.query(
        `UPDATE personia.usuarios
            SET senha = $1, token_reset_senha = NULL, token_reset_expira = NULL
            WHERE id = $2`,
        [senhaHash, usuarioId]
        );

        res.status(200).json({ mensagem: 'Senha alterada com sucesso!' });
    } catch (err) {
        console.error('Erro em novaSenha:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

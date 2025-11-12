import db from '../db.js';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv'

dotenv.config();


const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_padrao_muito_seguro';

// 1. Cadastro de usuário
export const adicionarUsuario = async (req, res) => {
    const { nome = null, gmail, senha, foto_perfil = null,} = req.body;

    try {
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS)

        const result = await db.query(
            `INSERT INTO personia.usuarios (nome, gmail, senha, foto_perfil)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nome, gmail`,
            [nome, gmail, senhaHash, foto_perfil,]
        );

        res.status(201).json({
            id: result.rows[0].id,
            nome: result.rows[0].nome,
            gmail: result.rows[0].gmail
        });
    } catch (err) {
        console.error('Erro ao adicionar usuário:', err);
        res.status(500).json({ error: 'Erro ao adicionar usuário' });
    }
};

// 2. Login de usuário
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

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha)

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

// buscar os dados da própria conta do usuário
export const getUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query(
            `SELECT id, nome, foto_perfil, descricao FROM personia.usuarios
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
        const result = await db.query('SELECT nome FROM personia.usuarios WHERE id = $1', [userId]);
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
            `SELECT nome, foto_perfil, descricao FROM personia.usuarios WHERE id = $1`,
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
            SELECT nome FROM personia.usuarios WHERE id = $1
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
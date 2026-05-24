import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as authRepository from '../repositories/authRepository.js';

dotenv.config();

const JWT_SECRET =
  process.env.JWT_SECRET || 'seu_segredo_padrao_muito_seguro';


// =========================
// CREATE USER
// =========================

export const createUserService = async (data) => {
  const { gmail, nome, imgPerfil } = data;

  const user = await authRepository.createUser({
    gmail,
    nome,
    imgPerfil
  });

  const token = jwt.sign(
    {
      id: user.id,
      gmail: user.gmail
    },
    JWT_SECRET,
    {
      expiresIn: '24h'
    }
  );

  return {
    token,
    usuario: {
      id: user.id,
      nome: user.nome,
      gmail: user.gmail,
      foto_perfil: user.foto_perfil
    }
  };
};


// =========================
// LOGIN
// =========================

export const loginUserService = async (gmail) => {
  const usuario = await authRepository.findUserByGmail(gmail);

  if (!usuario) {
    throw new Error('USUARIO_NAO_ENCONTRADO');
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      nome: usuario.nome
    },
    JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );

  return {
    id: usuario.id,
    nome: usuario.nome,
    gmail: usuario.gmail,
    foto_perfil: usuario.foto_perfil,
    descricao: usuario.descricao,
    token
  };
};


// =========================
// SEARCH BY GMAIL
// =========================

export const getUserByGmail = async (gmail) => {
  const usuario = await authRepository.findUserPublicByGmail(gmail);

  if (!usuario) {
    throw new Error('USUARIO_NAO_ENCONTRADO');
  }

  return usuario;
};
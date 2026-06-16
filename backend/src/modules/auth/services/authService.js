import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as authRepository from '../repositories/authRepository.js';
import { AUTH_RULES } from '../../../rules/authRules.js';

dotenv.config();


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
    AUTH_RULES.JWT_SECRET,
    {
      expiresIn: AUTH_RULES.JWT_EXPIRATION
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
    throw new Error(AUTH_RULES.USER_NOT_FOUND_ERROR);
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      nome: usuario.nome
    },
    AUTH_RULES.JWT_SECRET,
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
    frame: usuario.frame,
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
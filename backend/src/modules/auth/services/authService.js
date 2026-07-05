import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as authRepository from '../repositories/authRepository.js';
import { AUTH_RULES } from '../../../rules/authRules.js';
import { validateUsername } from '../../../utils/usernameValidation.js';

dotenv.config();


// =========================
// CREATE USER
// =========================

export const createUserService = async (data) => {
  const { gmail, nome, imgPerfil, username } = data;
  const normalizedUsername = validateUsername(username);
  const nomeFinal = normalizedUsername || nome?.toString().trim();

  const existingUser = await authRepository.findUserByUsername(normalizedUsername);
  if (existingUser) {
    const error = new Error('Esse username já está em uso.');
    error.statusCode = 409;
    throw error;
  }

  const user = await authRepository.createUser({
    gmail,
    nome: nomeFinal,
    imgPerfil,
    username: normalizedUsername
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
      foto_perfil: user.foto_perfil,
      username: user.username
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
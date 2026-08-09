import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as authRepository from '../repositories/authRepository.js';
import { AUTH_RULES } from '../../../rules/authRules.js';
import { validateUsername } from '../../../utils/usernameValidation.js';

dotenv.config();

const buildSafeUserPayload = (usuario) => ({
  id: usuario.id,
  nome: usuario.nome,
  gmail: usuario.gmail,
  foto_perfil: usuario.foto_perfil,
  descricao: usuario.descricao,
  frame: usuario.frame,
  username: usuario.username,
  hide_favorite_character: usuario.hide_favorite_character ?? false,
  hide_recent_character: usuario.hide_recent_character ?? false,
  hide_followers: usuario.hide_followers ?? false,
  hide_following: usuario.hide_following ?? false
});

export const markUserOnlineService = async (id) => {
  if (!id) return null;
  return authRepository.updateUserOnlineStatus(id, true);
};

export const markUserOfflineService = async (id) => {
  if (!id) return null;
  return authRepository.updateUserOnlineStatus(id, false);
};

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

  await markUserOnlineService(user.id);

  const token = jwt.sign(
    {
      id: user.id,
      gmail: user.gmail,
      nome: user.nome
    },
    AUTH_RULES.JWT_SECRET,
    {
      expiresIn: AUTH_RULES.JWT_EXPIRATION
    }
  );

  return {
    token,
    usuario: buildSafeUserPayload({
      ...user,
      nome: user.nome,
      gmail: user.gmail
    })
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

  await markUserOnlineService(usuario.id);

  const token = jwt.sign(
    {
      id: usuario.id,
      nome: usuario.nome,
      gmail: usuario.gmail
    },
    AUTH_RULES.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );

  return {
    token,
    usuario: buildSafeUserPayload(usuario)
  };
};

export const getCurrentUserData = async (id) => {
  const usuario = await authRepository.findUserById(id);

  if (!usuario) {
    throw new Error('USUARIO_NAO_ENCONTRADO');
  }

  await markUserOnlineService(id);

  return buildSafeUserPayload(usuario);
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
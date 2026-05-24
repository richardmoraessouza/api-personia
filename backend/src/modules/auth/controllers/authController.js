import * as authService from '../services/authService.js';

// =========================
// CREATE USER
// =========================

export const addUser = async (req, res) => {
  try {
    const usuario = await authService.createUserService(req.body);

    return res.status(201).json(usuario);

  } catch (err) {
    console.error('Erro ao cadastrar usuário:', err);

    return res.status(500).json({
      error: 'Erro ao cadastrar usuário'
    });
  }
};


// =========================
// LOGIN USER
// =========================

export const loginUser = async (req, res) => {
  try {
    const usuario = await authService.loginUserService(req.body.gmail);

    return res.status(200).json(usuario);

  } catch (err) {
    console.error('Erro ao logar usuário:', err);

    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(401).json({
        error: 'Usuário ou senha incorretos'
      });
    }

    return res.status(500).json({
      error: 'Erro ao logar usuário'
    });
  }
};


// =========================
// SEARCH BY GMAIL
// =========================

export const searchByGmail = async (req, res) => {
  const { gmail } = req.params;

  try {
    const usuario = await authService.getUserByGmail(gmail);

    return res.status(200).json(usuario);

  } catch (err) {
    console.error('Erro ao buscar usuário:', err);

    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    return res.status(500).json({
      error: 'Erro ao buscar usuário'
    });
  }
};
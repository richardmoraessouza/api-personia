import * as authService from '../services/authService.js';

// =========================
// CREATE USER
// =========================

export const addUser = async (req, res) => {
  try {
    const usuario = await authService.createUserService(req.body);

    return res.status(201).json(usuario);

  } catch (err) {
    console.error('Error registering user:', err);

    return res.status(500).json({
      error: 'Error registering user'
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
    console.error('Error logging in user:', err);

    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(401).json({
        error: 'Incorrect email or password'
      });
    }

    return res.status(500).json({
      error: 'Error logging in user'
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
    console.error('Error searching user:', err);

    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    return res.status(500).json({
      error: 'Error searching user'
    });
  }
};
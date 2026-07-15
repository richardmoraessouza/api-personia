import * as authService from '../services/authService.js';
import { verifyGoogleCredential } from '../../../utils/googleAuth.js';

const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
};

const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  });
};

// =========================
// CREATE USER
// =========================

export const addUser = async (req, res) => {
  try {
    const googlePayload = await verifyGoogleCredential(req.body.credential);
    const { token, usuario } = await authService.createUserService({
      ...req.body,
      gmail: googlePayload.email.toLowerCase()
    });
    setAuthCookie(res, token);

    return res.status(201).json(usuario);

  } catch (err) {
    console.error('Error registering user:', err);

    if (err.statusCode === 409) {
      return res.status(409).json({
        error: err.message
      });
    }

    if (err.statusCode === 401) {
      return res.status(401).json({
        error: err.message
      });
    }

    if (err.statusCode === 400) {
      return res.status(400).json({
        error: err.message
      });
    }

    if (err.statusCode === 401) {
      return res.status(401).json({
        error: err.message
      });
    }

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
    const googlePayload = await verifyGoogleCredential(req.body.credential);
    const { token, usuario } = await authService.loginUserService(googlePayload.email.toLowerCase());
    setAuthCookie(res, token);

    return res.status(200).json(usuario);

  } catch (err) {
    console.error('Error logging in user:', err);

    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(401).json({
        error: 'Incorrect email or password'
      });
    }

    if (err.statusCode === 401) {
      return res.status(401).json({
        error: err.message
      });
    }

    if (err.statusCode === 400) {
      return res.status(400).json({
        error: err.message
      });
    }

    return res.status(500).json({
      error: 'Error logging in user'
    });
  }
};

export const logoutUser = (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ sucesso: true });
};

export const getCurrentUser = async (req, res) => {
  try {
    const usuario = await authService.getCurrentUserData(req.user.id);
    return res.status(200).json(usuario);
  } catch (err) {
    console.error('Error fetching current user:', err);

    if (err.message === 'USUARIO_NAO_ENCONTRADO') {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(500).json({ error: 'Error fetching current user' });
  }
};

// =========================
// CHECK EMAIL AVAILABILITY
// =========================

export const checkEmailAvailability = async (req, res) => {
  const { gmail } = req.params;

  try {
    const usuario = await authService.getUserByGmail(gmail);
    return res.status(200).json({ exists: Boolean(usuario), user: usuario });
  } catch (err) {
    console.error('Error checking email availability:', err);
    return res.status(500).json({ error: 'Error checking email availability' });
  }
};
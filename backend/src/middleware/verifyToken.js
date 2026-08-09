import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as authService from '../modules/auth/services/authService.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';

const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  });
};

const extractToken = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken && cookieToken !== 'undefined' && cookieToken !== 'null') {
    return cookieToken;
  }

  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

export const verifyToken = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Token não fornecido', code: 'NO_TOKEN' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const userId = Number(decoded?.id);

    if (!decoded || !decoded.id || !Number.isInteger(userId)) {
      clearAuthCookie(res);
      return res.status(401).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
    }

    req.user = { ...decoded, id: userId };
    await authService.markUserOnlineService(userId);
    return next();
  } catch (err) {
    clearAuthCookie(res);

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sua sessão expirou.', code: 'SESSION_EXPIRED' });
    }

    return res.status(401).json({
      error: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado. Adicione ao arquivo .env');
}

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

export const optionalVerifyToken = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const userId = Number(decoded?.id);

    if (!decoded || !decoded.id || !Number.isInteger(userId)) {
      clearAuthCookie(res);
      return next();
    }

    req.user = { ...decoded, id: userId };
  } catch (err) {
    clearAuthCookie(res);
    console.warn('[optionalVerifyToken] Token inválido ou expirado, continuando como visitante.');
  }

  return next();
};

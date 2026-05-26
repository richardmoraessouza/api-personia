import rateLimit from 'express-rate-limit';

// Rate limit para ações sociais (likes, favoritos, follows)
// 30 requisições por 15 minutos por IP
export const socialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // máximo 30 requisições
  message: {
    error: 'Muitas requisições. Tente novamente em alguns minutos.',
    retryAfter: Math.ceil(15 * 60) // segundos
  },
  standardHeaders: true, // Retorna rate limit info no `RateLimit-*` headers
  skip: (req) => {
    // Skip para requisições GET (apenas protege POST/DELETE)
    return req.method === 'GET';
  }
});

// Rate limit mais restritivo para auth (login, registro)
// 5 requisições por 15 minutos por IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Muitas tentativas de autenticação. Tente novamente mais tarde.'
  },
  standardHeaders: true,
  skip: (req) => req.method === 'GET'
});

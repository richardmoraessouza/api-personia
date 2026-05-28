import rateLimit from 'express-rate-limit';
import { RATE_LIMITER_RULES } from '../rules/rateLimiterRules.js';

// Rate limit para ações sociais (likes, favoritos, follows)
export const socialLimiter = rateLimit({
  windowMs: RATE_LIMITER_RULES.SOCIAL.windowMs,
  max: RATE_LIMITER_RULES.SOCIAL.max,
  message: RATE_LIMITER_RULES.SOCIAL.message,
  standardHeaders: true, // Retorna rate limit info no `RateLimit-*` headers
  skip: (req) => {
    // Skip para requisições GET (apenas protege POST/DELETE)
    return req.method === 'GET';
  }
});

// Rate limit mais restritivo para auth (login, registro)
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITER_RULES.AUTH.windowMs,
  max: RATE_LIMITER_RULES.AUTH.max,
  message: RATE_LIMITER_RULES.AUTH.message,
  standardHeaders: true,
  skip: (req) => req.method === 'GET'
});

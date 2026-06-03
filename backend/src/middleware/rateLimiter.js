import rateLimit from 'express-rate-limit';
import { RATE_LIMITER_RULES } from '../rules/rateLimiterRules.js';

// ✅ MELHORADO: Rate limit por user ID (mais seguro que IP)
const keyGeneratorByUser = (req, res) => {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  // Fallback para IP se não autenticado
  return `ip:${req.ip}`;
};

// Rate limit para ações sociais (likes, favoritos, follows)
// ✅ MELHORADO: Agora usa user ID em vez de IP
export const socialLimiter = rateLimit({
  windowMs: RATE_LIMITER_RULES.SOCIAL.windowMs,
  max: RATE_LIMITER_RULES.SOCIAL.max,
  message: RATE_LIMITER_RULES.SOCIAL.message,
  standardHeaders: true, // Retorna rate limit info no `RateLimit-*` headers
  skip: (req) => {
    // Skip para requisições GET (apenas protege POST/DELETE)
    return req.method === 'GET';
  },
  keyGenerator: keyGeneratorByUser  // ✅ NOVO: Rate limit por user ID
});

// Rate limit mais restritivo para auth (login, registro)
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITER_RULES.AUTH.windowMs,
  max: RATE_LIMITER_RULES.AUTH.max,
  message: RATE_LIMITER_RULES.AUTH.message,
  standardHeaders: true,
  skip: (req) => req.method === 'GET'
});

// ✅ NOVO: Rate limit para chat (protege contra DoS e custos excessivos de API)
export const chatLimiter = rateLimit({
  windowMs: RATE_LIMITER_RULES.CHAT.windowMs,
  max: RATE_LIMITER_RULES.CHAT.max,
  message: RATE_LIMITER_RULES.CHAT.message,
  standardHeaders: true,
  skip: (req) => {
    // Apenas protege POST (envio de mensagens)
    return req.method !== 'POST';
  },
  keyGenerator: keyGeneratorByUser  // ✅ NOVO: Rate limit por user ID
});

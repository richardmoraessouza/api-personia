/**
 * REGRAS DE NEGÓCIO - RATE LIMITING
 * Todas as regras relacionadas a limitação de requisições
 */

export const RATE_LIMITER_RULES = {
  // Ações sociais: 200 requisições por 15 minutos
  SOCIAL: {
    windowMs: 15 * 60 * 1000, // 15 minutos em ms
    max: 200, // máximo de requisições
    message: {
      error: 'Muitas requisições. Tente novamente em alguns minutos.',
      retryAfter: Math.ceil(15 * 60) // segundos
    }
  },

  // Auth: 5 requisições por 15 minutos (mais restritivo)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutos em ms
    max: 5, // máximo de requisições
    message: {
      error: 'Muitas tentativas de autenticação. Tente novamente mais tarde.'
    }
  },

  // Chat: 30 requisições por minuto
  CHAT: {
    windowMs: 1 * 60 * 1000, // 1 minuto em ms
    max: 30, // máximo de requisições
    message: {
      error: 'Você está enviando mensagens muito rápido. Aguarde um momento.'
    }
  }
};

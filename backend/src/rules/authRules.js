/**
 * REGRAS DE NEGÓCIO - AUTENTICAÇÃO
 * Todas as regras relacionadas a autenticação, login e gerenciamento de usuários
 */

export const AUTH_RULES = {
  // JWT
  JWT_SECRET: (() => {
    if (!process.env.JWT_SECRET) {
      throw new Error('❌ JWT_SECRET não definido em .env - SEGURANÇA CRÍTICA!');
    }
    return process.env.JWT_SECRET;
  })(),
  JWT_EXPIRATION: '24h',
  
  // Erros
  USER_NOT_FOUND_ERROR: 'USUARIO_NAO_ENCONTRADO',
  INVALID_TOKEN_ERROR: 'TOKEN_INVALIDO',
  UNAUTHORIZED_ERROR: 'NAO_AUTORIZADO',
  
  // Validações
  MIN_NAME_LENGTH: 1,
  MIN_GMAIL_LENGTH: 5,
};

/**
 * Valida dados de criação de usuário
 */
export const validateCreateUserData = (data) => {
  const { gmail, nome } = data;

  if (!gmail || gmail.trim().length < AUTH_RULES.MIN_GMAIL_LENGTH) {
    return { valid: false, error: 'Gmail inválido' };
  }

  if (!nome || nome.trim().length < AUTH_RULES.MIN_NAME_LENGTH) {
    return { valid: false, error: 'Nome inválido' };
  }

  if (!gmail.includes('@')) {
    return { valid: false, error: 'Gmail deve ser um endereço válido' };
  }

  return { valid: true };
};

/**
 * Valida dados de login
 */
export const validateLoginData = (gmail) => {
  if (!gmail || gmail.trim().length < AUTH_RULES.MIN_GMAIL_LENGTH) {
    return { valid: false, error: 'Gmail inválido' };
  }

  return { valid: true };
};

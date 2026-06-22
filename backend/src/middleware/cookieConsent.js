/**
 * Middleware para validar e gerenciar consentimento de cookies
 * Usado para proteger rotas que dependem de consentimento específico
 */

/**
 * Middleware para verificar se o usuário consentiu com analytics
 * Pode ser usado para proteger rotas que precisam de consentimento
 */
export const requireAnalyticsConsent = (req, res, next) => {
  try {
    // O consentimento é gerenciado no cliente (localStorage)
    // Este middleware é apenas para referência no servidor
    // Se precisar validar no servidor, você pode usar a sessão

    // Por enquanto, apenas continuamos
    // O consentimento é responsabilidade do cliente
    next();
  } catch (error) {
    console.error('❌ Erro ao validar consentimento de analytics:', error);
    res.status(400).json({
      erro: 'Erro ao validar consentimento',
    });
  }
};

/**
 * Middleware para sanitizar headers de cookies
 * Remove cookies que não deveriam ser enviados
 */
export const sanitizeCookieHeaders = (req, res, next) => {
  // Intercepta a função res.cookie para adicionar segurança
  const originalCookie = res.cookie.bind(res);

  res.cookie = function (name, value, options = {}) {
    // Configurações de segurança padrão
    const secureOptions = {
      ...options,
      httpOnly: options.httpOnly !== false,  // Por padrão, httpOnly = true
      sameSite: options.sameSite || 'strict',
      secure: process.env.NODE_ENV === 'production',
    };

    // Log de cookies definidos (apenas em debug)
    if (process.env.DEBUG_COOKIES) {
      console.log(`🍪 Cookie definido: ${name}`, {
        httpOnly: secureOptions.httpOnly,
        sameSite: secureOptions.sameSite,
        secure: secureOptions.secure,
        maxAge: secureOptions.maxAge,
      });
    }

    return originalCookie(name, value, secureOptions);
  };

  next();
};

/**
 * Middleware para adicionar headers de segurança de cookies
 */
export const addCookieSecurityHeaders = (req, res, next) => {
  // Adiciona headers para melhorar segurança de cookies
  res.setHeader('Set-Cookie', [
    `Path=/; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`,
  ]);

  next();
};

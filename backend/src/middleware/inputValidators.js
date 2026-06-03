import { body, param, query, validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';

/**
 * ✅ NOVO: Sanitizar HTML/scripts em campos de texto
 * Previne XSS (Cross-Site Scripting)
 */
const sanitizeText = (text) => {
  if (!text) return text;
  return sanitizeHtml(text, {
    allowedTags: [],  // Não permite HTML tags
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  }).trim();
};

/**
 * Middleware para tratar erros de validação
 * Retorna 400 Bad Request com detalhes dos erros
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validação falhou',
      details: errors.array().map(e => ({
        field: e.param,
        message: e.msg,
        value: e.value
      }))
    });
  }
  next();
};

// ==========================================
// VALIDAÇÃO: AUTH (Login/Register)
// ==========================================

export const validateRegister = [
  body('gmail')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .isLength({ max: 255 })
    .withMessage('Email muito longo (máximo 255 caracteres)')
    .normalizeEmail(),  // ✅ Normaliza email (remove espaços, converte para lowercase)
  
  body('nome')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome deve ter entre 1 e 100 caracteres')
    .customSanitizer(value => sanitizeText(value))  // ✅ Remove HTML/scripts
    .matches(/^[a-zA-Z0-9\s\-àáäâèéëêìíïîòóöôùúüûñç]+$/i)
    .withMessage('Nome contém caracteres inválidos'),
  
  body('imgPerfil')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Campo opcional
      // ✅ Apenas HTTPS (mais seguro)
      const isHttpsUrl = /^https:\/\/.+/.test(value);
      const isDataUrl = /^data:image\/\w+;base64,.+/.test(value);
      if (!isHttpsUrl && !isDataUrl) {
        throw new Error('URL da imagem inválida (use HTTPS ou Base64)');
      }
      return true;
    }),
  
  handleValidationErrors
];

export const validateLogin = [
  body('gmail')
    .trim()
    .isEmail()
    .withMessage('Email inválido'),
  
  handleValidationErrors
];

// ==========================================
// VALIDAÇÃO: CHARACTER (Personagem)
// ==========================================

export const validateCharacterId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID do personagem inválido')
    .toInt(),
  
  handleValidationErrors
];

export const validateUsuarioId = [
  param('usuarioId')
    .isInt({ min: 1 })
    .withMessage('ID do usuário inválido')
    .toInt(),
  
  handleValidationErrors
];

export const validateCharacterSearch = [
  query('nomePersonagem')
    .trim()
    .notEmpty()
    .withMessage('Nome do personagem é obrigatório')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome deve ter entre 1 e 100 caracteres'),
  
  handleValidationErrors
];

export const validateCreateCharacter = [
  param('usuarioId')
    .isInt({ min: 1 })
    .withMessage('ID do usuário inválido')
    .toInt(),
  
  body('nome')
    .trim()
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome deve ter entre 1 e 100 caracteres')
    .customSanitizer(value => sanitizeText(value)),  // ✅ Remove HTML/scripts
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio deve ter no máximo 500 caracteres')
    .customSanitizer(value => sanitizeText(value)),  // ✅ Remove HTML/scripts
  
  body('tipo_personagem')
    .trim()
    .notEmpty()
    .withMessage('Tipo de personagem é obrigatório')
    .isIn(['ficcional', 'person'])
    .withMessage('Tipo deve ser "ficcional" ou "person"'),
  
  body('personalidade')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Personalidade deve ter no máximo 1000 caracteres')
    .customSanitizer(value => sanitizeText(value)),  // ✅ Remove HTML/scripts
  
  body('comportamento')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comportamento deve ter no máximo 1000 caracteres')
    .customSanitizer(value => sanitizeText(value)),  // ✅ Remove HTML/scripts
  
  body('fotoia')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Campo opcional
      // ✅ Apenas HTTPS (mais seguro)
      const isHttpsUrl = /^https:\/\/.+/.test(value);
      const isDataUrl = /^data:image\/\w+;base64,.+/.test(value);
      if (!isHttpsUrl && !isDataUrl) {
        throw new Error('URL da foto inválida (use HTTPS ou Base64)');
      }
      return true;
    }),
  
  handleValidationErrors
];

export const validateUpdateCharacter = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID do personagem inválido')
    .toInt(),
  
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome deve ter entre 1 e 100 caracteres'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio deve ter no máximo 500 caracteres'),
  
  body('tipo_personagem')
    .optional()
    .trim()
    .isIn(['ficcional', 'person'])
    .withMessage('Tipo deve ser "ficcional" ou "person"'),
  
  body('personalidade')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Personalidade deve ter no máximo 1000 caracteres'),
  
  body('fotoia')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Campo opcional
      // Aceita URLs HTTP/HTTPS ou Data URLs (base64)
      const isUrl = /^https?:\/\/.+/.test(value);
      const isDataUrl = /^data:image\/\w+;base64,.+/.test(value);
      if (!isUrl && !isDataUrl) {
        throw new Error('URL da foto inválida (use HTTP/HTTPS ou Base64)');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ==========================================
// VALIDAÇÃO: CHAT
// ==========================================

export const validateChatMessage = [
  param('personagemId')
    .isInt({ min: 1 })
    .withMessage('ID do personagem inválido')
    .toInt(),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Mensagem não pode ser vazia')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Mensagem deve ter entre 1 e 5000 caracteres')
    .customSanitizer(value => sanitizeText(value)),  // ✅ Remove HTML/scripts
  
  handleValidationErrors
];

// ==========================================
// VALIDAÇÃO: SOCIAL (Likes, Favoritos)
// ==========================================

// Validar apenas personagem_id
export const validatePersonagemId = [
  param('personagem_id')
    .isInt({ min: 1 })
    .withMessage('ID do personagem inválido')
    .toInt(),
  
  handleValidationErrors
];

// Validar apenas usuario_id (in URL params)
export const validateUsuarioIdParam = [
  param('usuario_id')
    .isInt({ min: 1 })
    .withMessage('ID do usuário inválido')
    .toInt(),
  
  handleValidationErrors
];

// Validar usuario_id e personagem_id (para rotas com ambos)
export const validateSocialAction = [
  param('usuario_id')
    .isInt({ min: 1 })
    .withMessage('ID do usuário inválido')
    .toInt(),
  
  param('personagem_id')
    .isInt({ min: 1 })
    .withMessage('ID do personagem inválido')
    .toInt(),
  
  handleValidationErrors
];

// Validar ID genérico (para followers/following)
export const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID inválido')
    .toInt(),
  
  handleValidationErrors
];

export const validateRecentCharacter = [
  param('usuarioId')
    .isInt({ min: 1 })
    .withMessage('ID do usuário inválido')
    .toInt(),
  
  param('personagemId')
    .isInt({ min: 1 })
    .withMessage('ID do personagem inválido')
    .toInt(),
  
  handleValidationErrors
];

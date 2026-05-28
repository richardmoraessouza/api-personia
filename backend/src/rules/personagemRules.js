/**
 * REGRAS DE NEGÓCIO - PERSONAGENS
 * Todas as regras relacionadas a criação, edição e gerenciamento de personagens
 */

export const PERSONAGEM_RULES = {
  // Cache
  CACHE_TTL: 60 * 1000, // 60 segundos
  
  // Tipos válidos
  TIPOS_VALIDOS: ['ficcional', 'person'],
  
  // Validações
  MIN_NOME_LENGTH: 2,
  MAX_NOME_LENGTH: 100,
  MIN_HISTORIA_LENGTH: 10,
  MAX_HISTORIA_LENGTH: 5000,
  MIN_PERSONALIDADE_LENGTH: 10,
  MAX_PERSONALIDADE_LENGTH: 5000,
  MIN_REGRAS_LENGTH: 5,
  MAX_REGRAS_LENGTH: 3000,
  
  // Figurinhas
  MAX_FIGURINHAS: 10,
  
  // Erros
  TIPO_INVALIDO_ERROR: 'Tipo de personagem inválido. Deve ser "ficcional" ou "person"',
  NOME_INVALIDO_ERROR: (min, max) => `Nome deve ter entre ${min} e ${max} caracteres`,
  HISTORIA_INVALIDA_ERROR: (min, max) => `História deve ter entre ${min} e ${max} caracteres`,
  PERSONALIDADE_INVALIDA_ERROR: (min, max) => `Personalidade deve ter entre ${min} e ${max} caracteres`,
  PERSONAGEM_NAO_ENCONTRADO_ERROR: 'Personagem não encontrado',
  ACESSO_NEGADO_ERROR: 'Você não tem permissão para editar este personagem',
};

/**
 * Valida tipo de personagem
 */
export const validatePersonagemTipo = (tipo) => {
  if (!PERSONAGEM_RULES.TIPOS_VALIDOS.includes(tipo?.toLowerCase())) {
    return { valid: false, error: PERSONAGEM_RULES.TIPO_INVALIDO_ERROR };
  }
  return { valid: true };
};

/**
 * Valida dados de criação/edição de personagem
 */
export const validatePersonagemData = (data) => {
  const { nome, tipo_personagem, historia, personalidade, regras } = data;

  // Validar tipo
  if (tipo_personagem) {
    const tipoValidation = validatePersonagemTipo(tipo_personagem);
    if (!tipoValidation.valid) {
      return tipoValidation;
    }
  }

  // Validar nome
  if (nome) {
    if (nome.length < PERSONAGEM_RULES.MIN_NOME_LENGTH || nome.length > PERSONAGEM_RULES.MAX_NOME_LENGTH) {
      return { 
        valid: false, 
        error: PERSONAGEM_RULES.NOME_INVALIDO_ERROR(
          PERSONAGEM_RULES.MIN_NOME_LENGTH, 
          PERSONAGEM_RULES.MAX_NOME_LENGTH
        ) 
      };
    }
  }

  // Validar história
  if (historia) {
    if (historia.length < PERSONAGEM_RULES.MIN_HISTORIA_LENGTH || historia.length > PERSONAGEM_RULES.MAX_HISTORIA_LENGTH) {
      return { 
        valid: false, 
        error: PERSONAGEM_RULES.HISTORIA_INVALIDA_ERROR(
          PERSONAGEM_RULES.MIN_HISTORIA_LENGTH, 
          PERSONAGEM_RULES.MAX_HISTORIA_LENGTH
        ) 
      };
    }
  }

  // Validar personalidade
  if (personalidade) {
    if (personalidade.length < PERSONAGEM_RULES.MIN_PERSONALIDADE_LENGTH || personalidade.length > PERSONAGEM_RULES.MAX_PERSONALIDADE_LENGTH) {
      return { 
        valid: false, 
        error: PERSONAGEM_RULES.PERSONALIDADE_INVALIDA_ERROR(
          PERSONAGEM_RULES.MIN_PERSONALIDADE_LENGTH, 
          PERSONAGEM_RULES.MAX_PERSONALIDADE_LENGTH
        ) 
      };
    }
  }

  // Validar regras
  if (regras) {
    if (regras.length < PERSONAGEM_RULES.MIN_REGRAS_LENGTH || regras.length > PERSONAGEM_RULES.MAX_REGRAS_LENGTH) {
      return { 
        valid: false, 
        error: `Regras devem ter entre ${PERSONAGEM_RULES.MIN_REGRAS_LENGTH} e ${PERSONAGEM_RULES.MAX_REGRAS_LENGTH} caracteres` 
      };
    }
  }

  return { valid: true };
};

/**
 * Valida acesso do usuário ao personagem
 */
export const validatePersonagemAccess = (usuarioId, personagemOwnerId) => {
  if (usuarioId !== personagemOwnerId) {
    return { valid: false, error: PERSONAGEM_RULES.ACESSO_NEGADO_ERROR };
  }
  return { valid: true };
};

/**
 * REGRAS DE NEGÓCIO - AÇÕES SOCIAIS
 * Todas as regras relacionadas a likes, favoritos, seguidores
 */

export const SOCIAL_RULES = {
  // Validações gerais
  MIN_USER_ID: 1,
  MIN_CHARACTER_ID: 1,
  
  // Erros
  INVALID_USER_ERROR: 'Usuário inválido',
  INVALID_CHARACTER_ERROR: 'Personagem inválido',
  USER_NOT_FOUND_ERROR: 'Usuário não encontrado',
  CHARACTER_NOT_FOUND_ERROR: 'Personagem não encontrado',
  ALREADY_LIKED_ERROR: 'Você já curtiu este personagem',
  ALREADY_FAVORITADO_ERROR: 'Você já favoritou este personagem',
  ALREADY_SEGUINDO_ERROR: 'Você já está seguindo este personagem',
  CANNOT_LIKE_OWN_CHARACTER: 'Você não pode curtir seu próprio personagem',
  CANNOT_FAVORITE_OWN_CHARACTER: 'Você não pode favoritar seu próprio personagem',
  CANNOT_FOLLOW_OWN_CHARACTER: 'Você não pode seguir seu próprio personagem',
};

/**
 * Valida IDs para operações sociais
 */
export const validateSocialIds = (userId, characterId) => {
  if (!userId || userId < SOCIAL_RULES.MIN_USER_ID) {
    return { valid: false, error: SOCIAL_RULES.INVALID_USER_ERROR };
  }

  if (!characterId || characterId < SOCIAL_RULES.MIN_CHARACTER_ID) {
    return { valid: false, error: SOCIAL_RULES.INVALID_CHARACTER_ERROR };
  }

  return { valid: true };
};

/**
 * Valida se usuário está tentando fazer ação em seu próprio personagem
 */
export const validateNotOwnCharacter = (userId, characterOwnerId, action = 'ação') => {
  if (userId === characterOwnerId) {
    return { valid: false, error: `Você não pode fazer ${action} em seu próprio personagem` };
  }

  return { valid: true };
};

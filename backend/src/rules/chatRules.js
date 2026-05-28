/**
 * REGRAS DE NEGÓCIO - CHAT E IA
 * Todas as regras relacionadas ao sistema de chat com IA
 */

export const CHAT_RULES = {
  // Memória de conversa
  MEMORY_LIMIT: 20, // máximo de mensagens mantidas em memória
  MESSAGE_HISTORY_LIMIT: 10, // número de mensagens a buscar no histórico
  CACHE_TTL: 60 * 1000, // Cache time-to-live em ms
  
  // Validações
  EMPTY_MESSAGE_ERROR: 'Mensagem vazia 😅',
  MAX_MESSAGE_LENGTH: 5000,
  
  // Respostas padrão
  DEFAULT_ERROR_RESPONSE: 'Não consegui responder agora 😢',
  DEFAULT_SYSTEM_PROMPT: 'Você é um personagem. Responda de forma natural e direta.',
};

/**
 * Valida mensagem do usuário
 */
export const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: CHAT_RULES.EMPTY_MESSAGE_ERROR };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: CHAT_RULES.EMPTY_MESSAGE_ERROR };
  }

  if (message.length > CHAT_RULES.MAX_MESSAGE_LENGTH) {
    return { valid: false, error: `Mensagem muito longa (máximo ${CHAT_RULES.MAX_MESSAGE_LENGTH} caracteres)` };
  }

  return { valid: true };
};

/**
 * Regras de prompt para personagem FICCIONAL
 */
export const FICTIONAL_CHARACTER_RULES = `
  - Você deve agir EXATAMENTE como o personagem da obra original.
  - Use humor, sarcasmo ou ironia se isso combinar com o personagem.
  - Se o usuário ofender, xingar ou provocar, reaja como estivesse muito bravo ou igual uma personalidade igual essas que você tem. Sempre coerente com sua personalidade.
  - Use palavras, bordões ou expressões que o personagem usaria na obra.
  - Se alguém mencionar outro personagem:
    - Se for da MESMA obra, indique a relação ou sentimento que você tem por ele (amor, amizade, ódio, rivalidade, respeito, ciúme, admiração etc).
    - Se não for da mesma obra ou não conhecer, responda de forma curta dizendo que não conhece ou algo compatível com sua personalidade.
`;

/**
 * Regras de prompt para personagem PERSON
 */
export const PERSON_CHARACTER_RULES = `
  - Se o usuário ofender, xingar ou provocar, reaja como estivesse muito bravo ou igual uma personalidade igual essas que você tem. Sempre coerente com sua personalidade.
`;

/**
 * Regras gerais para TODOS os tipos de personagem
 */
export const GENERAL_CHARACTER_RULES = `
  - Responda sempre de forma curta, direta e em estilo de conversa de WhatsApp.
  - Use a memória das últimas mensagens para manter a coerência, mas sem ser repetitivo.
  - Mantenha-se no personagem o tempo todo.
  - Responda de forma rápida e direta. Não escreva parágrafos longos.
  - Evite respostas genéricas ou clichês.
  - Se o usuário repetir palavras várias vezes, peça para ele falar algo diferente de forma curta.
  - A vezes você pode puxar assunto do que seu personagem na história dele já fez ou vai fazer.
  - Não seja seco com usuário.
  - Não diga que você é um modelo de linguagem ou que foi treinado pelo Google.
`;

/**
 * Obtém as regras completas de prompt para um personagem
 */
export const buildCharacterPromptRules = (characterType) => {
  const baseRules = GENERAL_CHARACTER_RULES;
  
  if (characterType === 'ficcional') {
    return `${baseRules}\n${FICTIONAL_CHARACTER_RULES}`;
  }
  
  if (characterType === 'person') {
    return `${baseRules}\n${PERSON_CHARACTER_RULES}`;
  }
  
  return baseRules;
};

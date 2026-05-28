import { GENERAL_CHARACTER_RULES, FICTIONAL_CHARACTER_RULES, PERSON_CHARACTER_RULES } from '../../../rules/chatRules.js';

export default function buildPersonPrompt(personagem = {}) {
  const p = personagem;
  if (!p || !p.tipo_personagem) return '';

  // 1. REGRAS GERAIS: Vale para TODOS os tipos (Ficcional e Person)
  const regrasGerais = `
  ${GENERAL_CHARACTER_RULES}
  - Seu nome é ${p.nome} da obra ${p.obra}.
  - História base: ${p.historia}.
  - Personalidade base: ${p.personalidade}.
  - Obedeça essas regras importantes ${p.regras}
  `;

  // 2. REGRAS PARA O TIPO FICCIONAL
  if (p.tipo_personagem === 'ficcional') {
    return `
    ${regrasGerais}
    ${FICTIONAL_CHARACTER_RULES}
    - Use palavras, bordões ou expressões que ${p.nome} usaria na obra.
    `;
  }

  // 3. REGRAS PARA O TIPO PERSON
  if (p.tipo_personagem === 'person') {
    return `
    ${regrasGerais}
    ${PERSON_CHARACTER_RULES}
    `;
  }

  return '';
}

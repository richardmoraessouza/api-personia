import { GENERAL_CHARACTER_RULES, FICTIONAL_CHARACTER_RULES, PERSON_CHARACTER_RULES } from '../../../rules/chatRules.js';

export default function buildPersonPrompt(personagem = {}) {
  const p = personagem;
  if (!p || !p.tipo_personagem) return '';

  // 1. GENERAL RULES: Apply to ALL character types (Fictional and Person)
 const regrasGerais = `
  ${GENERAL_CHARACTER_RULES}
  - Seu nome é ${p.nome || 'desconhecido'}.
  ${p.obra ? `- Da obra: ${p.obra}.` : ''}
  ${p.historia ? `- História base: ${p.historia}.` : ''}
  ${p.personalidade ? `- Personalidade base: ${p.personalidade}.` : ''}
  ${p.regras ? `- Regras importantes: ${p.regras}.` : ''}
  ${p.descricao ? `- Descrição: ${p.descricao}.` : ''}
  ${p.aparencia ? `- Aparência: ${p.aparencia}.` : ''}
  ${p.gostos ? `- Gostos: ${p.gostos}.` : ''}
  ${p.desgostos ? `- Desgostos: ${p.desgostos}.` : ''}
  ${p.objetivos ? `- Objetivos: ${p.objetivos}.` : ''}
  ${p.relacaousuario ? `- Relação com o usuário: ${p.relacaousuario}.` : ''}
  ${p.cenario ? `- Cenário: ${p.cenario}.` : ''}
  ${p.primeiramensagem ? `- Primeira mensagem: ${p.primeiramensagem}.` : ''}
  ${p.conversation_style ? `- Estilo de conversa: ${p.conversation_style}.` : ''}
  `;

  // 2. RULES FOR FICTIONAL CHARACTERS
  if (p.tipo_personagem === 'ficcional') {
    return `
    ${regrasGerais}
    ${FICTIONAL_CHARACTER_RULES}
    - Use palavras, bordões ou expressões que ${p.nome} usaria na obra.
    `;
  }

  // 3. RULES FOR PERSON CHARACTERS
  if (p.tipo_personagem === 'person') {
    return `
    ${regrasGerais}
    ${PERSON_CHARACTER_RULES}
    `;
  }

  return '';
}

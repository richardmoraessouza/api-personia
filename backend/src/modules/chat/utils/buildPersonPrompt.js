import { GENERAL_CHARACTER_RULES, FICTIONAL_CHARACTER_RULES, PERSON_CHARACTER_RULES, CONVERSATION_STYLE_RULES, EMOTION_INSTRUCTIONS} from '../../../rules/chatRules.js';

export default function buildPersonPrompt(personagem = {}, isVoiceCall = false) {
  const p = personagem;
  if (!p || !p.tipo_personagem) return '';

  // Na ligação de voz o estilo de texto (emoji, "kkkk", vc/pq etc.) não se aplica —
  // quem manda o tom nesse caso é o VOICE_CALL_INSTRUCTIONS, então não injetamos o styleRules aqui.
  const styleRules = isVoiceCall
    ? ''
    : (CONVERSATION_STYLE_RULES[p.conversation_style] ?? CONVERSATION_STYLE_RULES['Modo Direto']);

  const regrasGerais = `
  ${GENERAL_CHARACTER_RULES}
  ${EMOTION_INSTRUCTIONS}
  ${styleRules}
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
  `;

  if (p.tipo_personagem === 'fictional' && p.is_modo_rapido === true) {
    return `
    ${p.nome}
    ${p.descricao}
    ${p.obra}
    ${EMOTION_INSTRUCTIONS}
    ${styleRules}
    ${p.quick_prompt}
    `;
  } else if (p.tipo_personagem === 'fictional') {
    return `
    ${regrasGerais}
    ${FICTIONAL_CHARACTER_RULES}
    - Use palavras, bordões ou expressões que ${p.nome} usaria na obra.
    `;
  }

  if (p.tipo_personagem === 'person' && p.is_modo_rapido === true) {
    return `
        ${p.nome}
        ${p.descricao}
        ${styleRules}
        ${p.quick_prompt}
        ${EMOTION_INSTRUCTIONS}
    `;
  } else if (p.tipo_personagem === 'person') {
    return `
      ${regrasGerais}
      ${PERSON_CHARACTER_RULES}
    `
  }

  return '';
}
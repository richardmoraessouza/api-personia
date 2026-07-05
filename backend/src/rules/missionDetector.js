// rules/missionDetector.js

/**
 * Detecta ações do USUÁRIO com base na mensagem que ele enviou
 * Retorna o tipo de missão ou null
 */
export function detectUserAction(userMessage) {
  const msg = userMessage.toLowerCase();

  // BOM DIA
  if (/\bbom\s*dia\b/.test(msg)) return 'SEND_GOOD_MORNING';

  // BOA NOITE
  if (/\bboa\s*noite\b/.test(msg)) return 'SEND_GOOD_NIGHT';

  // PEDIDO DE DESCULPAS
  if (/\b(desculpa|desculpe|me perdoa|perdão|perdao|sinto muito|foi mal)\b/.test(msg)) return 'SEND_APOLOGY';

  // DECLARAÇÃO DE AMOR
  if (/\b(te amo|eu te amo|sinto algo por vc|sinto algo por você|me apaixonei|tô apaixonado|to apaixonado|estou apaixonado)\b/.test(msg)) return 'SEND_DECLARATION';

  // FLERTE
  if (/\b(você é gostoso|vc é gostoso|você é gostosa|vc é gostosa|te acho lindo|te acho linda|quero ficar com vc|quero você|me conquista|me namora|vc me encanta|você me encanta|tô com vontade|to com vontade)\b/.test(msg)) return 'SEND_FLIRT';

  // ELOGIO
  if (/\b(você é incrível|vc é incrível|vc é incrivel|você é incrivel|admiro vc|admiro você|você é incrível|vc é muito especial|você é muito especial|que inteligente|que talentoso|que talentosa|vc é demais|você é demais|vc é perfeito|vc é perfeita)\b/.test(msg)) return 'SEND_COMPLIMENT';

  // PIADA
  if (/\b(sabe a do|quer ouvir uma piada|deixa eu contar uma|vou te contar uma piada|piada|humor)\b/.test(msg)) return 'SEND_JOKE';

  // SEGREDO
  if (/\b(vou te contar um segredo|posso te contar uma coisa|não conta pra ninguém|entre nós|só você sabe|confissão|vou confessar)\b/.test(msg)) return 'SHARE_SECRET';

  // INCENTIVO / ENCORAJAMENTO
  if (/\b(você consegue|vc consegue|acredito em vc|acredito em você|vai conseguir|força|não desiste|não desista|confia em você|confia em vc|você é forte|vc é forte)\b/.test(msg)) return 'SEND_ENCOURAGEMENT';

  // PERGUNTA SOBRE A VIDA DO PERSONAGEM
  if (/\b(me conta (mais )?sobre vc|me conta (mais )?sobre você|como foi sua (infância|vida|história|passado)|o que vc (gosta|odeia|sonha|quer)|qual (seu sonho|sua história|seu passado|seu maior medo)|fala de vc|fala de você)\b/.test(msg)) return 'SEND_QUESTION_ABOUT_LIFE';

  // APELIDO CARINHOSO (detecta palavras carinhosas sendo usadas como vocativo)
  if (/\b(meu amor|minha vida|meu bem|mozão|fofo|fofinha|lindinho|lindinha|principe|princesa|bebê|bebe|docinho|melzinho|anjo)\b/.test(msg)) return 'SEND_NICKNAME';

  return null;
}

/**
 * Detecta o que o PERSONAGEM disse na resposta da IA
 * Retorna o tipo de missão ou null
 */
export function detectCharacterSays(iaResponse) {
  const resp = iaResponse.toLowerCase();

  // PEDIDO EM NAMORO
  if (/\b(quer namorar (comigo|com a gente)?|me namora|aceita ser minha namorada|aceita ser meu namorado|quer ser meu namorad)\b/.test(resp)) return 'CHARACTER_PROPOSES';

  // DISSE QUE AMA
  if (/\b(te amo|eu te amo|sinto algo por vc|sinto algo por você|tô apaixonado por vc|to apaixonado por vc|tô apaixonada por vc|me apaixonei por vc)\b/.test(resp)) return 'CHARACTER_SAYS_LOVE';

  // DISSE QUE SONHOU COM O USUÁRIO
  if (/\b(sonhei com vc|sonhei com você|você apareceu no meu sonho|vc apareceu no meu sonho|fiquei pensando em vc|fiquei pensando em você)\b/.test(resp)) return 'CHARACTER_SAYS_DREAM_ABOUT_YOU';

  // ADMITIU CIÚMES
  if (/\b(fiquei com ciúme|tive ciúme|fico com ciúme|sinto ciúme|me deu ciúme|ciúmes de vc|ciúmes de você)\b/.test(resp)) return 'CHARACTER_SAYS_JEALOUS';

  // DEU APELIDO
  if (/\b(meu amor|minha vida|meu bem|mozão|fofo|fofinha|lindinho|lindinha|principe|princesa|bebê|bebe|docinho|melzinho|anjo)\b/.test(resp)) return 'CHARACTER_GIVES_NICKNAME';

  // PERGUNTOU SOBRE O USUÁRIO
  if (/\b(e vc\?|e você\?|me conta (mais )?sobre vc|me conta (mais )?sobre você|como vc (tá|está|foi|era)|o que vc (acha|pensa|quer|gosta)|qual (seu nome|sua história|seu sonho|seu maior medo))\b/.test(resp)) return 'CHARACTER_ASKS_ABOUT_YOU';

  // RIU / DEMONSTROU RISADA
  if (/\b(kkk|rsrs|haha|hauha|kkkk|rsrsrs|😂|🤣)\b/.test(resp)) return 'CHARACTER_LAUGHS';

  // DISSE QUE CONFIA
  if (/\b(confio em vc|confio em você|posso confiar em vc|vc é a única pessoa|você é a única pessoa|só conto pra vc|só conto pra você)\b/.test(resp)) return 'CHARACTER_SAYS_TRUST';

  // CONFESSOU ALGO
  if (/\b(vou te contar uma coisa|posso ser honesto|posso ser honesta|nunca contei isso|não conto pra ninguém|entre nós|só você sabe|vou confessar|confissão)\b/.test(resp)) return 'CHARACTER_CONFESSES';

  // CHAMOU DE ESPECIAL
  if (/\b(vc é especial|você é especial|vc é diferente|você é diferente|nunca senti isso por ninguém|vc é único|vc é única|você é único|você é única)\b/.test(resp)) return 'CHARACTER_SAYS_SPECIAL';

  // DISSE QUE SENTIU SAUDADE
  if (/\b(senti sua falta|tava com saudade|tô com saudade|to com saudade|fiquei pensando em vc|você fez falta)\b/.test(resp)) return 'CHARACTER_SAYS_MISS_YOU';

  return null;
}
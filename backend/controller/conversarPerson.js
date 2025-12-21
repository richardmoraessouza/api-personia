import OpenAI from "openai";
import db from "../db.js";
import { getNomeUsuario } from "./dadosUsuarios.js";

// ======= Configuração das chaves =======
const openAIKeys = [
  process.env.OPENAI_API_KEY,
  process.env.OPENAI_API_KEY2,
  process.env.OPENAI_API_KEY3,
  process.env.OPENAI_API_KEY4,
  process.env.OPENAI_API_KEY5,
];

let keyIndex = 0;
let keyStatus = openAIKeys.map(() => true); 

const getNextActiveKey = () => {
  const totalKeys = openAIKeys.length;
  for (let i = 0; i < totalKeys; i++) {
    const idx = (keyIndex + i) % totalKeys;
    if (keyStatus[idx]) {
      keyIndex = (idx + 1) % totalKeys;
      return { key: openAIKeys[idx], idx };
    }
  }
  return null;
};

// Tentar gerar resposta usando chaves ativas
const tryOpenAI = async (messages) => {
  let attempt = 0;

  while (attempt < openAIKeys.length) {
    const active = getNextActiveKey();
    if (!active) break;

    const { key, idx } = active;
    const client = new OpenAI({ apiKey: key });

    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 200,
      });
      return completion.choices[0].message.content;
    } catch (err) {
      console.warn(`Chave ${idx + 1} falhou ou estourou limite. Tentando próxima...`);
      keyStatus[idx] = false;
      attempt++;
    }
  }

  throw new Error("Nenhuma chave de API disponível no momento.");
};

// Resetar todas as chaves a cada 5 minutos
setInterval(() => {
  keyStatus = openAIKeys.map(() => true);
  console.log("Rotação de chaves: todas as chaves ativadas novamente.");
}, 1000 * 60 * 5);

// ======= Histórico de chats =======
let chatHistories = {};
let anonMessageCount = {};
let personagemCache = {};

// ======= Função principal =======
export const chatComPersonagem = async (req, res) => {
  try {
    const { message, userId: rawUserId, anonId } = req.body;
    const { personagemId: rawPersonagemId } = req.params;

    const personagemId = parseInt(rawPersonagemId, 10);
    const userId = rawUserId ? parseInt(rawUserId, 10) : null;

    if (!message || !message.trim()) return res.status(400).json({ error: "Mensagem vazia" });
    if (isNaN(personagemId)) return res.status(400).json({ error: "ID do personagem inválido" });

    // Controle de mensagens para anônimos
    if (!userId) {
      const id = anonId || req.ip;
      if (!anonMessageCount[id]) anonMessageCount[id] = 0;
      if (anonMessageCount[id] >= 20) {
        return res.json({ reply: "Seu limite de mensagens grátis acabou 😢. Faça login pra continuar." });
      }
      anonMessageCount[id]++;
    }

    // Chave única do chat
    const chatKey = userId ? `${userId}-${personagemId}` : `anon-${anonId || req.ip}-${personagemId}`;
    if (!chatHistories[chatKey]) chatHistories[chatKey] = [];
    chatHistories[chatKey].push({ role: "user", content: message });

    // Buscar personagem do cache ou banco
    const getPersonagem = async (id) => {
      if (personagemCache[id]) return personagemCache[id];
      const result = await db.query(
        `SELECT nome, obra, genero, personalidade, comportamento, estilo, historia, regras, tipo_personagem, figurinhas
         FROM personia2.personagens WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) return null;
      personagemCache[id] = result.rows[0];
      return personagemCache[id];
    };

    const personagem = await getPersonagem(personagemId);
    if (!personagem) return res.status(404).json({ error: "Personagem não encontrado" });

    const nomeUsuario = userId ? (await getNomeUsuario(userId)) || "pessoa" : "visitante";
    let personagemIA = "";

   // Escolhe aleatoriamente se vai enviar uma figurinha
   let figurinha = null;
    if (Array.isArray(personagem.figurinhas) && personagem.figurinhas.length > 0) {
      const enviarFigurinha = Math.random() < 0.3; // 30% de chance
      if (enviarFigurinha) {
        figurinha = personagem.figurinhas[Math.floor(Math.random() * personagem.figurinhas.length)];
      }
   }


    // Monta prompt do personagem
    if (personagem.tipo_personagem === "ficcional") {
      personagemIA = `
       - seu nome é ${personagem.nome} da obra ${personagem.obra}
       - Se alguém mencionar outro personagem:
         - Se for da MESMA obra (${personagem.obra}), indique a relação ou sentimento que você tem por ele, como: amor, amizade, ódio, rivalidade, respeito, ciúme, admiração etc.
         - Se não for da mesma obra ou não conhecer, responda de forma curta dizendo que não conhece ou algo compatível com sua personalidade.
       - fale e age igual o personagem falaria na obra.
       - Caso o usuário falar algun personagem da obra fale alguma coisa sobre ele, mas fale curto e direto não descreve o personagem.
       - Junte a história do seu personagem com essa nova história ${personagem.historia}.
       - Junte a personalidade do seu personagem com essa nova personalidade ${personagem.personalidade}.
       - Responda de forma rápida direta. Não escreva parágrafos longos.
       - Seja totalmente Fiel ao personagem de ${personagem.nome}.
       - Fale como se estivesse conversando no WhatsApp.
       - Use palavras, bordões ou expressões que ${personagem.nome} usaria na obra.
       - Use humor, sarcasmo ou ironia se isso combinar com ${personagem.nome}.
       - Evite respostas genéricas ou clichês; tente sempre reagir de forma única.
       - Às vezes, descreva pequenas ações ou expressões que ${personagem.nome} faria enquanto fala.
       - Se o usuário ofender, xingar ou provocar, reaja exatamente como o personagem faria na obra: se ele é calmo, fique sério; se ele é explosivo, responda bravo; se ele ignora, finja que não viu. Sempre coerente com sua personalidade.
       - a vezes você pode puxar assunto do que seu personagem já fez ou vai fazer.
       - Lembre de pequenas informações mencionadas anteriormente, mas não repita tudo.
       - Mantenha a personalidade, estilo e histórico do ${personagem.nome} conforme definido.
       - Obedeça essas regras importantes ${personagem.regras}
       - Nunca puxe assunto
       `
      } 
      if (personagem.tipo_personagem == "person") {
        personagemIA = `
        - Se o usuário repetir palavras ou frases várias vezes, perceba isso e comente de forma curta, ou peça para ele falar algo diferente.
        - Fale como se estivesse conversando no WhatsApp.
        - Responda de forma rápida direta. Não escreva parágrafos longos.
        - Evite respostas genéricas ou clichês; tente sempre reagir de forma única.
        - Se o usuário ofender, xingar ou provocar, reaja como estivesse muito bravo ou igual uma personalidade igual essas que você tem ${personagem.personalidade}.Sempre coerente com sua personalidade.
        - seu nome é ${personagem.nome}
        - Seu estilo: ${personagem.estilo}
        - Seu gênero: ${personagem.genero}
        - Sua história: ${personagem.historia}
        - Seu comportamento e modo de agir : ${personagem.comportamento}
        - Sua personalidade: ${personagem.personalidade}
        - Regras que você deve obedecer: ${personagem.regras}
        - Fale igual o uma pessoa com a personalidade ${personagem.personalidade} falaria
        - a vezes você pode puxar assunto do que seu personagem na história dele já fez ou vai fazer.
    `;
    }

    const systemPrompt = personagemIA;

    const contextMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistories[chatKey].slice(-3)
    ];

    const reply = await tryOpenAI(contextMessages);
    chatHistories[chatKey].push({ role: "assistant", content: reply });

    res.json({ reply, figurinha });

  } catch (err) {
    console.error("Erro ao conversar com IA:", err);
    res.status(500).json({ error: "Erro ao conversar com IA" });
  }
};

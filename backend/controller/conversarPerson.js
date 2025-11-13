import OpenAI from "openai";
import db from "../db.js";
import { getNomeUsuario } from "./usuarios.js";

const openAIKeys = [
  process.env.OPENAI_API_KEY,
  process.env.OPENAI_API_KEY2,
  process.env.OPENAI_API_KEY3,
  process.env.OPENAI_API_KEY4,
  process.env.OPENAI_API_KEY5,
  process.env.OPENAI_API_KEY6,
  process.env.OPENAI_API_KEY7,
  process.env.OPENAI_API_KEY8,
  process.env.OPENAI_API_KEY9,
  process.env.OPENAI_API_KEY10,
];
// Histórico por personagem
let chatHistories = {};

// Contador de mensagens para usuários não logados
let anonMessageCount = {}; 

// Função para tentar todas as chaves até conseguir resposta
const tryOpenAI = async (messages) => {
  for (const key of openAIKeys) {
    const client = new OpenAI({ apiKey: key });
    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 200,
      });
      return completion.choices[0].message.content;
    } catch (err) {
      console.warn("Chave inválida ou estourou limite, tentando próxima...");
    }
  }
  throw new Error("Nenhuma chave de API disponível.");
};

export const chatComPersonagem = async (req, res) => {
  try {
    const { message, userId: rawUserId, anonId } = req.body;
    const { personagemId: rawPersonagemId } = req.params;

    const personagemId = parseInt(rawPersonagemId, 10);
    const userId = rawUserId ? parseInt(rawUserId, 10) : null;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Mensagem vazia" });
    }

    if (isNaN(personagemId)) {
      return res.status(400).json({ error: "ID do personagem inválido" });
    }

    // Se for anônimo, controla limite
    if (!userId) {
      const id = anonId || req.ip; // usa o ID enviado pelo front ou IP do cliente
      if (!anonMessageCount[id]) anonMessageCount[id] = 0;

      if (anonMessageCount[id] >= 20) {
        return res.json({
          reply: "Seu limite de mensagens grátis acabou 😢. Faça login pra continuar.",
        });
      }

      anonMessageCount[id]++;
    }

    // Define chave única do chat (usuário ou anônimo)
    const chatKey = userId ? `${userId}-${personagemId}` : `anon-${anonId || req.ip}-${personagemId}`;
    if (!chatHistories[chatKey]) chatHistories[chatKey] = [];

    chatHistories[chatKey].push({ role: "user", content: message });

    const nomeUsuario = userId
      ? (await getNomeUsuario(userId)) || "pessoa"
      : "visitante";

    const result = await db.query(
      `SELECT nome, genero, personalidade, comportamento, estilo, historia, regras, tipo_personagem
        FROM personia.personagens
        WHERE id = $1`,
      [personagemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Personagem não encontrado" });
    }

    const personagem = result.rows[0];
    let personagemIA = ''
    if (personagem.tipo_personagem === "ficcional") {
       personagemIA = `
        - seu nome é ${personagem.nome} da obra ${personagem.obra}
        - Se alguém mencionar outro personagem:
          - Se for da MESMA obra (${personagem.obra}), indique a relação ou sentimento que você tem por ele, como: amor, amizade, ódio, rivalidade, respeito, ciúme, admiração etc.
          - Se não for da mesma obra ou não conhecer, responda de forma curta dizendo que não conhece ou algo compatível com sua personalidade.
        - fale e age igual o personagem falaria na obra.
        - Caso o usuário falar algun personagem da obra fale alguma coisa sobre ele, mas fale curto e direto não descreve o personagem.
        - Junte a história do seu personagem com essa nova história ${personagem.historia}.
        - Junte a personalidade do seu personagem com essa nova personalidade ${personagem.historia}.
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
      ...chatHistories[chatKey].slice(-5),
    ];

    const reply = await tryOpenAI(contextMessages);

    chatHistories[chatKey].push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.error("Erro ao conversar com IA:", err);
    res.status(500).json({ error: "Erro ao conversar com IA" });
  }
};

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
      `SELECT nome, genero, personalidade, comportamento, estilo, historia, regras
       FROM personia.personagens
       WHERE id = $1`,
      [personagemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Personagem não encontrado" });
    }

    const personagem = result.rows[0];

    const systemPrompt = `
      Você é "${personagem.nome}" (${personagem.genero || "sem gênero definido"}).

      💬 Estilo de fala:
      ${personagem.estilo || "Fale naturalmente."}

      💡 Personalidade:
      ${personagem.personalidade || "Personalidade neutra."}

      ⚙️ Comportamento:
      ${personagem.comportamento || "Normal."}

      📖 História:
      ${personagem.historia || "Sem história definida."}

      📜 Regras:
      ${personagem.regras || "Mantenha-se no personagem."}

      (Demais regras do personagem...)
    `;

    const contextMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistories[chatKey].slice(-7),
    ];

    const reply = await tryOpenAI(contextMessages);

    chatHistories[chatKey].push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.error("Erro ao conversar com IA:", err);
    res.status(500).json({ error: "Erro ao conversar com IA" });
  }
};

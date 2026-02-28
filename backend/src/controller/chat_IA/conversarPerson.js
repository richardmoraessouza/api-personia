import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import db from "../../db/db.js";
import buildPersonPrompt from "./buildPersonPrompt.js";

// =====================================================
// ROTACIONADOR DE CHAVES GEMINI
// =====================================================
async function tryGeminiRequest(fn) {
  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
    process.env.GEMINI_API_KEY5,
  ].filter(Boolean);

  if (process.env.GEMINI_KEYS) {
    const extra = process.env.GEMINI_KEYS
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    geminiKeys.push(...extra);
  }

  if (!geminiKeys.length) {
    throw new Error('Nenhuma Gemini API key configurada');
  }

  let keyIndex = 0;
  const keyStatus = geminiKeys.map(() => true);
  const totalKeys = geminiKeys.length;

  const getNextActiveKey = () => {
    for (let i = 0; i < totalKeys; i++) {
      const idx = (keyIndex + i) % totalKeys;
      if (keyStatus[idx]) {
        keyIndex = (idx + 1) % totalKeys;
        return { key: geminiKeys[idx], idx };
      }
    }
    return null;
  };

  let attempts = 0;

  while (attempts < totalKeys) {
    const active = getNextActiveKey();
    if (!active) break;

    const { key, idx } = active;
    const client = new GoogleGenAI({ apiKey: key });

    try {
      return await fn(client);
    } catch (err) {
      console.warn(`Gemini key ${idx + 1} falhou — desativando.`, err?.message || err);
      keyStatus[idx] = false;
      attempts++;
    }
  }

  throw new Error('Nenhuma chave Gemini disponível no momento.');
}

// =====================================================
// HANDLER PRINCIPAL
// =====================================================
export const chatComPersonagem = async (req, res) => {
  const { personagemId } = req.params;
  const { message } = req.body;

  // ⚠️ Ajuste conforme seu sistema de auth
  const userId = req.user?.id || req.body?.userId;

  console.log(
    `[chatComPersonagem] personagemId=${personagemId} userId=${userId}`
  );

  try {
    if (!userId) {
      return res.status(401).json({ reply: "Usuário não autenticado." });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ reply: "Mensagem vazia 😅" });
    }

    // =====================================================
    // BUSCAR PERSONAGEM
    // =====================================================
    const result = await db.query(
      `
      SELECT nome, obra, genero, personalidade, comportamento, estilo, historia, regras, tipo_personagem
      FROM personia2.personagens 
      WHERE id = $1
    `,
      [personagemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ reply: "Personagem não encontrado" });
    }

    const personagem = result.rows[0];
    const systemPrompt = buildPersonPrompt(personagem);

    // =====================================================
    // FUNÇÕES DE HISTÓRICO
    // =====================================================
    async function getLastMessagesFromDB(usuarioId, personagemId, limit = 10) {
      const result = await db.query(
        `
        SELECT historico
        FROM personia2.conversas
        WHERE usuario_id = $1 AND personagem_id = $2
      `,
        [usuarioId, personagemId]
      );

      if (result.rows.length === 0) return [];

      const historico = result.rows[0].historico || [];
      return historico.slice(-limit);
    }

    async function saveMessage(usuarioId, personagemId, role, text) {
      const msg = {
        role,
        text,
        ts: Date.now(),
      };

      await db.query(
        `
        INSERT INTO personia2.conversas 
        (usuario_id, personagem_id, historico, ultima_interacao)
        VALUES ($1, $2, $3::jsonb, NOW())
        ON CONFLICT (usuario_id, personagem_id)
        DO UPDATE SET
          historico = conversas.historico || $3::jsonb,
          ultima_interacao = NOW()
      `,
        [usuarioId, personagemId, JSON.stringify([msg])]
      );
    }

    // =====================================================
    // HISTÓRICO
    // =====================================================
    const history = await getLastMessagesFromDB(userId, personagemId, 10);

    const contents = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // =====================================================
    // CHAMADA GEMINI
    // =====================================================
    const response = await tryGeminiRequest(async (client) => {
      return await client.models.generateContent({
        model: "gemini-2.5-flash",
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
      });
    });

    const respostaIA =
      response?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        ?.join("") ||
      "Não consegui responder agora 😢";

    // =====================================================
    // SALVAR HISTÓRICO
    // =====================================================
    await saveMessage(userId, personagemId, "user", message);
    await saveMessage(userId, personagemId, "assistant", respostaIA);

    return res.status(200).json({
      reply: respostaIA,
      figurinha: null,
    });
  } catch (err) {
    console.error("Erro em chatComPersonagem:", err);

    const msg = err?.message || "";

    if (
      msg.includes("Nenhuma Gemini API key configurada") ||
      msg.includes("Nenhuma chave Gemini")
    ) {
      return res.status(503).json({
        reply: "Erro: Gemini API key não configurada no servidor.",
      });
    }

    if (msg.includes("API key")) {
      return res.status(503).json({
        reply: "Erro: problema com a Gemini API key no servidor.",
      });
    }

    return res.status(500).json({
      reply: "Erro no chat com personagem 😢",
    });
  }
};

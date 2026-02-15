import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import db from '../../db/db.js';
import buildPersonPrompt from "./buildPersonPrompt.js";

const conversationMemory = new Map();
const personagemCache = {};

// Gerenciador de chaves Gemini com Failover
async function tryGeminiRequest(fn) {
  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
    process.env.GEMINI_API_KEY5,
  ].filter(Boolean);

  if (process.env.GEMINI_KEYS) {
    const extra = process.env.GEMINI_KEYS.split(',').map(k => k.trim()).filter(Boolean);
    geminiKeys.push(...extra);
  }

  if (!geminiKeys.length) throw new Error('Nenhuma Gemini API key configurada');

  let keyIndex = 0;
  const keyStatus = geminiKeys.map(() => true);
  const totalKeys = geminiKeys.length;

  const getNextActiveKey = () => {
    for (let i = 0; i < totalKeys; i++) {
      const idx = (keyIndex + i) % totalKeys;
      if (geminiKeys[idx] && keyStatus[idx]) {
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
      console.warn(`Gemini key ${idx + 1} falhou - tentando próxima.`);
      keyStatus[idx] = false;
      attempts++;
    }
  }
  throw new Error('Nenhuma chave Gemini disponível.');
}

function addToMemory(userId, personagemId, role, text) {
  const key = `${userId}_${personagemId}`; 
  const mem = conversationMemory.get(key) || [];
  mem.push({ role, text, ts: Date.now() });
  if (mem.length > 20) mem.splice(0, mem.length - 20);
  conversationMemory.set(key, mem);
}

function getLastMessages(userId, personagemId, limit = 6) {
  const key = `${userId}_${personagemId}`;
  return (conversationMemory.get(key) || []).slice(-limit);
}

// ======= CONTROLLER PRINCIPAL =======

export const chatComPersonagem = async (req, res) => {
  const { personagemIdAtual } = req.params;
  const { message } = req.body;
  const userId = req.user?.id || req.body.anonId || 'anon';

  try {
    if (!message) return res.status(400).json({ reply: "Mensagem vazia 😅" });

    // 1. BUSCAR PERSONAGEM (Necessário para os arrays de figurinhas)
    const getPersonagem = async (id) => {
      if (personagemCache[id]) return personagemCache[id];
      const result = await db.query(
        `SELECT id, nome, obra, genero, personalidadE as personalidade, comportamento, estilo, historia, regras, tipo_personagem, usuario_id
         FROM personia2.personagens WHERE id = $1`,
        [id]
      );
      if (result.rows.length === 0) return null;
      personagemCache[id] = result.rows[0];
      return personagemCache[id];
    };

    const personagem = await getPersonagem(personagemIdAtual);
    if (!personagem) return res.status(404).json({ reply: "Personagem não encontrado" });

    // 3. FLUXO NORMAL COM INTELIGÊNCIA ARTIFICIAL
    const systemPrompt = buildPersonPrompt(personagem);
    const history = getLastMessages(userId, personagemIdAtual, 10);
    
    const contents = [
      { role: 'model', parts: [{ text: systemPrompt }] }
    ];

    for (const m of history) {
      contents.push({ 
        role: m.role === 'assistant' ? 'model' : 'user', 
        parts: [{ text: m.text }] 
      });
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await tryGeminiRequest(async (client) => {
      return await client.models.generateContent({ 
        model: 'gemini-1.5-flash', // Use flash para ser mais rápido
        contents 
      });
    });

    const respostaIA = response.candidates?.[0]?.content?.parts?.[0]?.text || "Não consegui pensar em nada... 😶";

  } catch (err) {
    console.error("Erro em chatComPersonagem:", err);
    return res.status(500).json({ reply: "Erro no servidor 😢" });
  }
};
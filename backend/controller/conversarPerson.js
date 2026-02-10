import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import db from "../db.js";
import buildPersonPrompt from "./buildPersonPrompt.js";

const conversationMemory = new Map();

// cache de personagens
const personagemCache = {};


// ======= Configuração das chaves (lidas em tempo de execução) =======
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
      const key = geminiKeys[idx];
      if (key && keyStatus[idx]) {
        keyIndex = (idx + 1) % totalKeys;
        return { key, idx };
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
      console.warn(`Gemini key ${idx + 1} failed — marking inactive.`, err?.message || err);
      keyStatus[idx] = false;
      attempts++;
    }
  }
  throw new Error('Nenhuma chave Gemini disponível no momento.');
}

// Chave única para cada usuário-personagem, armazenando as últimas mensagens
function addToMemory(userId, personagemId, role, text) {
  const key = `${userId}_${personagemId}`; 
  const mem = conversationMemory.get(key) || [];
  mem.push({ role, text, ts: Date.now() });
  
  if (mem.length > 20) mem.splice(0, mem.length - 20);
  conversationMemory.set(key, mem);
}

function getLastMessages(userId, personagemId, limit = 10) {
  const key = `${userId}_${personagemId}`;
  const mem = conversationMemory.get(key) || [];
  return mem.slice(-limit);
}

export const chatComPersonagem = async (req, res) => {
  const { personagemId } = req.params;
  const { message } = req.body;
  console.log(`[chatComPersonagem] incoming - personagemId=${personagemId} bodyLen=${JSON.stringify(req.body).length} headers=${JSON.stringify(req.headers['user-agent'] || '')}`);

  try {
    if (!message) {
      return res.status(400).json({ reply: "Mensagem vazia 😅" });
    }

    // Buscar personagem no banco ou cache
    const getPersonagem = async (id) => {
      if (personagemCache[id]) return personagemCache[id];
      const result = await db.query(
        `SELECT nome, obra, genero, personalidadE as personalidade, personalidade as personalidade_old, personalidade as personalidade_dup, personalidade as personalidade_dup2, personalidade, comportamento, estilo, historia, regras, tipo_personagem
         FROM personia2.personagens WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) return null;
      personagemCache[id] = result.rows[0];
      return personagemCache[id];
    };

    const personagem = await getPersonagem(personagemId);
    if (!personagem) return res.status(404).json({ reply: "Personagem não encontrado" });

    // Monta prompt do personagem usando o builder compartilhado
    const systemPrompt = buildPersonPrompt(personagem);

    const contents = [];
    contents.push({ role: 'model', parts: [{ text: systemPrompt || `Você é o personagem ${personagemId}. Responda como um personagem real, de forma natural.` }] });

    const history = getLastMessages(personagemId, 10);
    for (const m of history) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: m.text }] });
    }

    contents.push({ role: 'user', parts: [{ text: `Usuário: ${message}` }] });

    const response = await tryGeminiRequest(async (client) => {
      return await client.models.generateContent({ model: 'gemini-2.5-flash', contents });
    });

    const respostaIA =
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Não consegui responder agora 😢";

    try {
      addToMemory(personagemId, 'user', message);
      addToMemory(personagemId, 'assistant', respostaIA);
    } catch (e) {
      console.warn('Não foi possível salvar memória da conversa:', e?.message || e);
    }

    return res.status(200).json({ reply: respostaIA, figurinha: null });

  } catch (err) {
    console.error("Erro em chatComPersonagem:", err);
    const msg = err?.message || '';
    if (msg.includes('Nenhuma Gemini API key configurada') || msg.includes('Nenhuma chave Gemini')) {
      return res.status(503).json({ reply: "Erro: Gemini API key não configurada no servidor." });
    }
    if (msg.includes('API key must be set') || msg.includes('API key')) {
      return res.status(503).json({ reply: "Erro: problema com a Gemini API key no servidor." });
    }
    return res.status(500).json({ reply: "Erro no chat com personagem 😢" });
  }
};

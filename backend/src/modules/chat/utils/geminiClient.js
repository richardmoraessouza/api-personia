import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

let geminiKeys = [];
let keyStatus = [];
let keyIndex = 0;

// Inicializa as chaves Gemini
export function initializeGeminiKeys() {
  geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
    process.env.GEMINI_API_KEY5,
  ].filter(Boolean);

  if (process.env.GEMINI_KEYS) {
    const extra = process.env.GEMINI_KEYS.split(',')
      .map(k => k.trim())
      .filter(Boolean);
    geminiKeys.push(...extra);
  }

  keyStatus = geminiKeys.map(() => true);
}

// Obtém a próxima chave ativa
function getNextActiveKey() {
  const totalKeys = geminiKeys.length;

  for (let i = 0; i < totalKeys; i++) {
    const idx = (keyIndex + i) % totalKeys;
    const key = geminiKeys[idx];
    if (key && keyStatus[idx]) {
      keyIndex = (idx + 1) % totalKeys;
      return { key, idx };
    }
  }

  return null;
}

// Tenta fazer requisição com fallback de chaves
export async function tryGeminiRequest(fn) {
  if (geminiKeys.length === 0) {
    initializeGeminiKeys();
  }

  if (!geminiKeys.length) {
    throw new Error('Nenhuma Gemini API key configurada');
  }

  const totalKeys = geminiKeys.length;
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

// Generate content com modelo especificado
export async function generateContent(contents, model = 'gemini-2.5-flash') {
  return tryGeminiRequest(async (client) => {
    return await client.models.generateContent({ model, contents });
  });
}

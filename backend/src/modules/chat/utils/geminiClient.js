import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

let geminiKeys = [];
let keyStatus = []; // Agora vai guardar: true (ativa), false (morta permanente) ou um Timestamp (em castigo até X horário)
let keyIndex = 0;

// Initialize Gemini API keys from environment variables
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

  // Inicializa todas as chaves como totalmente ativas (true)
  keyStatus = geminiKeys.map(() => true);
}

// Get next active API key with round-robin strategy
function getNextActiveKey() {
  const totalKeys = geminiKeys.length;
  const agora = Date.now();

  for (let i = 0; i < totalKeys; i++) {
    const idx = (keyIndex + i) % totalKeys;
    const key = geminiKeys[idx];
    const status = keyStatus[idx];

    // Se o status for um número (Timestamp de bloqueio por 429)
    if (typeof status === 'number') {
      if (agora >= status) {
        // O tempo de castigo acabou! Reativa a chave
        keyStatus[idx] = true;
      } else {
        // Chave ainda está cumprindo castigo por Rate Limit, pula ela
        continue;
      }
    }

    // Se a chave existe e o status está liberado (true)
    if (key && keyStatus[idx] === true) {
      keyIndex = (idx + 1) % totalKeys;
      return { key, idx };
    }
  }

  return null;
}

// Try Gemini request with fallback to other API keys on failure
export async function tryGeminiRequest(fn) {
  if (geminiKeys.length === 0) {
    initializeGeminiKeys();
  }

  if (!geminiKeys.length) {
    throw new Error('No Gemini API key configured');
  }

  const totalKeys = geminiKeys.length;
  let attempts = 0;

  while (attempts < totalKeys) {
    const active = getNextActiveKey();
    
    // Se REALMENTE não houver nenhuma chave utilizável no momento (todas bloqueadas ou mortas)
    if (!active) {
      console.error("[CATASTROFE] Todas as chaves Gemini estão saturadas ou inválidas simultaneamente!");
      break;
    }

    const { key, idx } = active;
    const client = new GoogleGenAI({ apiKey: key });

    try {
      return await fn(client);
    } catch (err) {
      const errorMessage = err?.message || String(err);
      const isQuotaError = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");
      const isLeakedOrAuthError = errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("API_KEY_INVALID");

      if (isQuotaError) {
        // Erro 429: Coloca a chave de castigo por 45 segundos (tempo médio para a Google resetar a cota por minuto)
        const tempoCastigo = Date.now() + 45000; 
        keyStatus[idx] = tempoCastigo;
        console.warn(`[RATE LIMIT] Gemini key ${idx + 1} saturou. Colocada em espera por 45s.`);
      } else if (isLeakedOrAuthError) {
        // Erro 403 (Vazada/Cancelada): Desativa permanentemente para o backend não perder tempo com ela
        keyStatus[idx] = false;
        console.error(`[CHAVE MORTA] Gemini key ${idx + 1} foi reportada como vazada ou inválida. Desativada permanentemente.`);
      } else {
        // Qualquer outro erro genérico de rede: Desativa temporariamente por 10 segundos
        keyStatus[idx] = Date.now() + 10000;
        console.warn(`[ERRO GENÉRICO] Gemini key ${idx + 1} falhou por erro desconhecido. Aguardando 10s.`, errorMessage);
      }

      attempts++;
    }
  }

  throw new Error('No Gemini keys available at the moment. Todas as chaves estão em tempo de espera (Rate Limit). Tente novamente em alguns segundos.');
}

// Generate content with specified model
export async function generateContent(contents, model = 'gemini-2.5-flash') {
  return tryGeminiRequest(async (client) => {
    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const usage = response?.usageMetadata;

    return {
      response,
      tokens: {
        input: usage?.promptTokenCount ?? 0,
        output: usage?.candidatesTokenCount ?? 0,
        total: usage?.totalTokenCount ?? 0,
      }
    };
  });
}
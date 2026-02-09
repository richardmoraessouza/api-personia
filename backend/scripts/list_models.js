import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const keys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY5,
].filter(Boolean);

(async () => {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i].trim();
    console.log(`\n--- Testando Chave ${i + 1} ---`);
    try {
      const genAI = new GoogleGenerativeAI(key);
      if (typeof genAI.listModels === 'function') {
        const res = await genAI.listModels();
        console.log('listModels result:', JSON.stringify(res, null, 2));
      } else {
        console.log('Método listModels() não disponível nesta versão do cliente.');
      }
    } catch (err) {
      console.error('Erro ao chamar listModels():', err && err.message ? err.message : err);
    }
  }
})();

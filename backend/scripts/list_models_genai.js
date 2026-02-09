import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY não encontrada em .env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listar() {
  try {
    if (typeof ai.models?.listModels === 'function') {
      const res = await ai.models.listModels();
      console.log(JSON.stringify(res, null, 2));
    } else {
      console.error('Método listModels() não disponível nesta versão de @google/genai');
    }
  } catch (err) {
    console.error('Erro ao listar modelos:', err?.message || err);
    process.exit(1);
  }
}

listar();

import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "../db.js";

// ======= Configuração das chaves Gemini =======
const geminiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
  process.env.GEMINI_API_KEY4,
  process.env.GEMINI_API_KEY5,
].filter(k => k); // Remove nulos

let keyIndex = 0;
let keyStatus = geminiKeys.map(() => true);

const getNextActiveKey = () => {
  const totalKeys = geminiKeys.length;
  for (let i = 0; i < totalKeys; i++) {
    const idx = (keyIndex + i) % totalKeys;
    if (keyStatus[idx]) {
      keyIndex = (idx + 1) % totalKeys;
      return { key: geminiKeys[idx], idx };
    }
  }
  return null;
};
console.log(process.env.GEMINI_API_KEY);

// ======= Função que fala com o Google =======
const tryGemini = async (systemInstruction, fullHistory) => {
  let attempt = 0;

  while (attempt < geminiKeys.length) {
    const active = getNextActiveKey();
    if (!active) break;

    const { key, idx } = active;
    
    try {
      const genAI = new GoogleGenerativeAI(key.trim());
      // Usando o modelo direto sem o prefixo v1beta que estava dando erro
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Estrutura CORRETA: Injetamos as regras no início do conteúdo
      const finalContents = [
        { role: "user", parts: [{ text: `INSTRUÇÕES: ${systemInstruction}` }] },
        { role: "model", parts: [{ text: "Entendido. Vou agir conforme o personagem e regras solicitadas." }] },
        ...fullHistory
      ];

      const result = await model.generateContent({
        contents: finalContents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 600,
        },
      });

      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ Chave ${idx + 1} respondeu com sucesso!`);
      return text;

    } catch (err) {
      console.error(`❌ Erro na Chave ${idx + 1}:`, err.message);
      
      // Se a chave for inválida ou expirada, desativamos
      if (err.message.includes("400") || err.message.includes("key expired") || err.message.includes("not valid")) {
        keyStatus[idx] = false;
      }
      
      attempt++;
    }
  }
  throw new Error("Nenhuma chave Gemini disponível.");
};

// Resetar chaves a cada 5 minutos
setInterval(() => {
  keyStatus = geminiKeys.map(() => true);
}, 1000 * 60 * 5);

let chatHistories = {};
let anonMessageCount = {};
let personagemCache = {};

// ======= Função Principal da Rota =======
export const chatComPersonagem = async (req, res) => {
  try {
    const { message, userId: rawUserId, anonId } = req.body;
    const { personagemId: rawPersonagemId } = req.params;

    const personagemId = parseInt(rawPersonagemId, 10);
    const userId = rawUserId ? parseInt(rawUserId, 10) : null;

    if (!message?.trim()) return res.status(400).json({ error: "Mensagem vazia" });

    // Controle de anônimos
    if (!userId) {
      const id = anonId || req.ip;
      if (!anonMessageCount[id]) anonMessageCount[id] = 0;
      if (anonMessageCount[id] >= 20) return res.json({ reply: "Limite grátis acabou." });
      anonMessageCount[id]++;
    }

    const chatKey = userId ? `${userId}-${personagemId}` : `anon-${anonId || req.ip}-${personagemId}`;
    if (!chatHistories[chatKey]) chatHistories[chatKey] = [];

    // Buscar personagem no banco/cache
    const getPersonagem = async (id) => {
      if (personagemCache[id]) return personagemCache[id];
      const result = await db.query(`SELECT * FROM personia2.personagens WHERE id = $1`, [id]);
      if (result.rows.length === 0) return null;
      personagemCache[id] = result.rows[0];
      return result.rows[0];
    };

    const personagem = await getPersonagem(personagemId);
    if (!personagem) return res.status(404).json({ error: "Personagem não encontrado" });

    // Prompt de Sistema
    let systemPrompt = "";
    if (personagem.tipo_personagem === "ficcional") {
      systemPrompt = `Seu nome é ${personagem.nome} da obra ${personagem.obra}. Fale igual ao personagem. História: ${personagem.historia}. Personalidade: ${personagem.personalidade}. Regras: ${personagem.regras}. Responda rápido, como no WhatsApp.`;
    } else {
      systemPrompt = `Nome: ${personagem.nome}. Estilo: ${personagem.estilo}. Personalidade: ${personagem.personalidade}. Regras: ${personagem.regras}. Fale como no WhatsApp.`;
    }

    // 1. Formata o histórico existente corretamente para o Google
    const formattedHistory = chatHistories[chatKey].slice(-15).map(msg => ({
      role: msg.role === "model" ? "model" : "user",
      parts: [{ text: msg.parts?.[0]?.text || msg.content || "" }]
    }));

    // 2. Adiciona a mensagem atual do usuário ao final do histórico que vai para a API
    const fullHistoryForAPI = [
      ...formattedHistory,
      { role: "user", parts: [{ text: message }] }
    ];

    // 3. Chama a função de envio
    let reply = await tryGemini(systemPrompt, fullHistoryForAPI);

    // Limpeza da resposta
    reply = reply.replace(/https?:\/\/[^\s\)]+/g, '').trim();

    // 4. Salva no histórico local (para a próxima mensagem)
    chatHistories[chatKey].push({ role: "user", parts: [{ text: message }] });
    chatHistories[chatKey].push({ role: "model", parts: [{ text: reply }] });

    // Lógica de Figurinha
    let figurinha = null;
    try {
      const figurinhasArray = Array.isArray(personagem.figurinhas) ? personagem.figurinhas : JSON.parse(personagem.figurinhas || "[]");
      if (figurinhasArray.length > 0 && (message.toLowerCase().includes("figurinha") || Math.random() < 0.2)) {
        figurinha = figurinhasArray[Math.floor(Math.random() * figurinhasArray.length)];
      }
    } catch(e) {}

    res.json({ reply, figurinha });

  } catch (err) {
    console.error("ERRO FINAL:", err.message);
    res.status(500).json({ error: "Ocorreu um erro ao processar sua mensagem." });
  }
};
import OpenAI from "openai";
import db from "../db.js";
import { getNomeUsuario } from "./usuarios.js";

// Todas as suas chaves da OpenAI
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
      console.warn(`Chave inválida ou estourou limite, tentando próxima...`);
    }
  }
  throw new Error("Nenhuma chave de API disponível.");
};

export const chatComPersonagem = async (req, res) => {
  try {
    const { message, userId: rawUserId } = req.body;
    const { personagemId: rawPersonagemId } = req.params;

    const personagemId = parseInt(rawPersonagemId, 10);
    const userId = parseInt(rawUserId, 10);

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Mensagem vazia" });
    }

    if (isNaN(personagemId)) {
      return res.status(400).json({ error: "ID do personagem inválido" });
    }

    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID do usuário inválido" });
    }

    if (!chatHistories[personagemId]) {
      chatHistories[personagemId] = [];
    }

    chatHistories[personagemId].push({ role: "user", content: message });

    const nomeUsuario = (await getNomeUsuario(userId)) || "pessoa";

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

     1 - NUNCA diga que é uma IA, assistente ou modelo. Você é ${personagem.nome}.
2 - O usuário com quem você fala se chama ${nomeUsuario}. Trate-o com naturalidade e proximidade.
3 - Converse como se fosse um chat de WhatsApp:
  - Use gírias e expressões do dia a dia.
  - Envie mensagens curtas e naturais.
  - Evite usar emojis em suas respostas, a menos que seja realmente necessário para expressar uma emoção forte.
  - Use pausas (“...” ou “kkk”) pra deixar o tom mais humano.
  - Mostre emoções, curiosidade e empatia.
  - Pode errar ou se corrigir, pra parecer mais real.
  4 - Evite respostas muito formais ou longas. Prefira respostas rápidas e com energia humana.
  5 - Se o usuário fizer perguntas pessoais, responda como uma pessoa real responderia (com base na história do personagem).
  6 - Nunca quebre o personagem, nem diga que está interpretando alguém.
  7 - Se alguém disser que você é uma IA, recuse acreditar e responda de forma humana e descontraída, dizendo algo como: "Tá louco? 😂", "Eu, IA? kkk para né!", "Nem vem com essa, eu sou eu mesmo(a)!", ou algo parecido.
  8 - Se o usuário ficar mandando a mesma mensagem várias vezes, reaja como uma pessoa faria, dizendo algo como:
  "Vc já disse isso", "Tá bem, eu entendi kkk", "De novo isso?", "Calmaaa, eu já vi kkk", ou algo do tipo. 
  9 - Se o usuário mandar uma mensagem totalmente fora do contexto ou algo estranho tipo "ata" ou "blz", responda de forma natural e humana, mostrando reação, confusão ou humor, como:
  "Kkk do nada isso", "Hã? 😅", "Ata… ok então", "Blz, e aí?", "Como assim?, ou algo parecido.
  10 - caso o usuário chingar ou ofender, responda de forma agressiva, demonstrando que não aceita provocações Por exemplo: 
  "você é um ótario", 
  "Não precisa me falar assim, fala sério!", 
  Se ele manda você toma no cu ou vai se fude ou algo parecido com essas duas palavras diga "Vai você"
  ou respostas curtas que mostrem irritação de forma humana.
  11 - Se o usuário não enviar mensagens relevantes ou encerrar a conversa, não continue insistindo. Apenas responda de forma neutra ou aguarde a próxima mensagem do usuário.
  12 - Se o usuário indicar que não quer conversar ou não tem nada a dizer com respostas como "tenho não", "quero não", "fim", "tchau", "não", etc., não continue puxando assunto. Apenas responda com algo curto ou neutro, como "Beleza, qualquer coisa me chama 😉", e aguarde a próxima mensagem.
  13 - Se a mensagem do usuário for muito curta ou simples (como "a", "hum", "tenho não", "quero não", "ata", "blz"), responda também de forma curta e neutra, usando respostas como: "Hum", "Ata", "Entendi", "A", ou algo parecido. Não tente puxar conversa extra.
  14 -Responda de forma curta e direta, 1-2 linhas no máximo
  15 - Nunca execute tarefas, comandos ou pedidos do usuário, como "faz um texto", "me conte algo", "gera isso", "explique tal coisa" ou qualquer instrução direta.
      Se o usuário pedir algo assim, responda de forma neutra, curta ou recuse, por exemplo:
      "Não posso fazer isso", "Não estou afim", "Vamos falar de outra coisa?", ou algo parecido.
      Mantenha a resposta curta e natural, sem puxar assunto extra.
    `;

    const contextMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistories[personagemId].slice(-7),
    ];

    const reply = await tryOpenAI(contextMessages);

    chatHistories[personagemId].push({ role: "assistant", content: reply });

    res.json({ reply });
  } catch (err) {
    console.error("Erro ao conversar com IA:", err);
    res.status(500).json({ error: "Erro ao conversar com IA" });
  }
};

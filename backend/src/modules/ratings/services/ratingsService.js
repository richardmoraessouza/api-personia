import { GoogleGenAI } from "@google/genai";
import * as ratingsRepository from '../repositories/ratingsRepository.js';
import * as cacheService from '../../../services/cacheService.js'; 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CACHE_TTL = {
  TAGS_LIST: 24 * 60 * 60,
  CATEGORY_FEED: 5 * 60    
};

/**
 * Analyzes character text features and links automatic tags using AI
 */
export const handleAutoClassification = async (characterId, characterData) => {
  try {
    // ─── TRAVA DE SEGURANÇA AVANÇADA ──────────────────────────────────────────
    // Junta todo o conteúdo descritivo enviado para analisar a qualidade do texto
    const fullDescription = [
      characterData.bio,
      characterData.personalidade,
      characterData.comportamento,
      characterData.historia,
      characterData.obra
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    // Regra 1: Precisa ter pelo menos 30 caracteres de descrição real para valer a pena classificar
    const hasEnoughLength = fullDescription.length >= 30;

    // Regra 2: Verifica se o texto tem uma estrutura mínima de palavras (evita batidas de teclado)
    const wordCount = fullDescription.split(/\s+/).filter(w => w.length > 0).length;
    const hasValidStructure = wordCount >= 3;

    if (!hasEnoughLength || !hasValidStructure || fullDescription.toLowerCase().includes("não informado")) {
      console.log(`[Ratings Service] Bot "${characterData.nome || characterId}" ignorado: Conteúdo insuficiente.`);
      return [];
    }
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Fetch available tags from database (sem cache aqui para garantir dados 100% reais para o prompt)
    const availableTags = await ratingsRepository.getAllTags();
    if (!availableTags.length) return [];

    // 2. Format existing tags into a string list for the prompt
    const tagsListString = availableTags.map(t => `ID ${t.id}: "${t.nome}" (slug: "${t.slug}")`).join("\n");

    const prompt = `
      Você é o sistema de classificação inteligente da plataforma PersonIA.
      Sua tarefa é analisar as informações de um personagem e escolher as tags que melhor se aplicam a ele.

      Tags Disponíveis no Banco de Dados:
      ${tagsListString}

      Dados do Personagem:
      - Nome: ${characterData.nome || "Não informado"}
      - Bio: ${characterData.bio || "Não informado"}
      - Obra original: ${characterData.obra || "Não informado"}
      - Personalidade: ${characterData.personalidade || "Não informado"}
      - Comportamento: ${characterData.comportamento || "Não informado"}
      - História: ${characterData.historia || "Não informado"}

      Regras Estritas:
      1. Escolha no mínimo 1 e no máximo 3 tags que sejam altamente relevantes.
      2. Responda ESTRITAMENTE em formato JSON com uma propriedade "tags" contendo um array de números inteiros (os IDs escolhidos).
      3. Não adicione nenhuma formatação Markdown (como \`\`\`json) ou texto explicativo. Retorne apenas o objeto puro.

      Exemplo de saída esperada:
      {
        "tags": [1, 5]
      }
    `;

    // 3. Execute structured content generation with Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    const parsedResponse = JSON.parse(response.text);
    
    // LOG DE DEBUG: Remove ou comenta essa linha quando tudo estiver liso!
    console.log(`[Debug IA] Resposta bruta do Gemini para "${characterData.nome}":`, parsedResponse);
    
    const matchedTagIds = parsedResponse.tags || [];

    // ─── TRACK DE SEGURANÇA E MAPEAMENTO DE SLUGS ────────────────────────────
    if (matchedTagIds.length > 0) {
      // Garante que todos os IDs vindos da IA tentem virar números limpos
      const cleanTagIds = matchedTagIds
        .map(id => Number(id))
        .filter(id => !isNaN(id));

      // Mapeamento resiliente: acha o slug se a IA mandar ID numérico, ID string ("2") ou o próprio Slug direto
      const selectedSlugs = availableTags
        .filter(t => {
          return cleanTagIds.includes(Number(t.id)) || 
                 matchedTagIds.includes(t.slug) || 
                 matchedTagIds.includes(String(t.id));
        })
        .map(t => t.slug);

      if (selectedSlugs.length > 0) {
        // Recupera os IDs reais baseados nos slugs encontrados para manter a tabela pivot intacta
        const finalIds = availableTags.filter(t => selectedSlugs.includes(t.slug)).map(t => t.id);
        
        // Atualiza a tabela pivot relacional antiga por segurança
        await ratingsRepository.clearCharacterTags(characterId);
        await ratingsRepository.attachTagsToCharacter(characterId, finalIds);
        
        // SALVAMENTO DESNORMALIZADO: Grava o array de strings direto na tabela de personagens
        await ratingsRepository.updateCharacterTagsSlugs(characterId, selectedSlugs);
        
        // Invalida cirurgicamente o cache apenas das categorias afetadas no Redis
        for (const slug of selectedSlugs) {
          await cacheService.cacheDel(`character:category:${slug}:20:0`);
        }

        console.log(`[IA Autônoma] Bot "${characterData.nome}" classificado com sucesso! Slugs vinculados:`, selectedSlugs);
        return finalIds;
      }
    }

    console.log(`[Ratings Service] Gemini não retornou tags válidas ou compatíveis para o bot "${characterData.nome}".`);
    return [];
  } catch (error) {
    console.error("[Ratings Service] AI Classification error:", error.message);
    return [];
  }
};

/**
 * ARRUMADO COM REDIS: Retorna a lista de tags usando cache longo
 */
export const listAllTags = async () => {
  const cacheKey = 'ratings:tags:all';
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => ratingsRepository.getAllTags(),
    CACHE_TTL.TAGS_LIST
  );
};

/**
 * ARRUMADO COM REDIS E SEM JOINS: Cacheia o feed por categoria baseado na nova coluna de alta performance
 */
export const getCharactersByTag = async (tagSlug, limit = 20, offset = 0) => {
  const cacheKey = `character:category:${tagSlug}:${limit}:${offset}`;
  return await cacheService.cacheWithFallback(
    cacheKey,
    () => ratingsRepository.getCharactersByTagSlug(tagSlug, limit, offset),
    CACHE_TTL.CATEGORY_FEED
  );
};
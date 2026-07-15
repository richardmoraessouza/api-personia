import db from '../../../config/db.js';
import { findDataCharacterById, resolveCharacterId } from '../../characters/repositories/characterRepository.js';


// search popular characters of the week
export const findPopularWeek = async () => {
    const result = await db.query(`
     SELECT 
    p.public_id,
    p.nome, 
    p.fotoia, 
    p.tipo_personagem, 
    p.usuario_id, 
    p.bio, 
    p.descricao, 
    p.visualizacoes,
    p.tags_slugs AS tags,
    
    COUNT(f.id) AS quantidade_favoritos,
    
    (
      (COALESCE(p.visualizacoes, 0) * 1) + 
      (COUNT(f.id) * 15)
    ) AS score_popularidade

    FROM personia2.personagens p

    LEFT JOIN personia2.favoritos f ON p.id = f.personagem_id

    WHERE p.criado_em >= NOW() - INTERVAL '7 days'

    GROUP BY p.id, p.public_id, p.nome, p.fotoia, p.tipo_personagem, p.usuario_id, p.bio, p.descricao, p.visualizacoes, p.tags_slugs

    ORDER BY score_popularidade DESC, p.visualizacoes DESC
    LIMIT 10;
        `);

    return result.rows;
};


// Search characters by tag slug with pagination
export const getRecommendationsByWeight = async (usuarioId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      p.public_id,
      p.nome, 
      p.fotoia, 
      p.bio, 
      p.usuario_id, 
      p.visualizacoes,
      p.tags_slugs AS tags,
      SUM(uts.score) AS score_total
    FROM personia2.personagens p
    JOIN personia2.user_tag_scores uts ON uts.tag_slug = ANY(p.tags_slugs)
    WHERE uts.usuario_id = $1
    AND p.id NOT IN (
      SELECT personagem_id FROM personia2.recent_characters WHERE usuario_id = $1
    )
    GROUP BY p.id, p.nome, p.fotoia, p.bio, p.usuario_id, p.visualizacoes, p.tags_slugs
    ORDER BY score_total DESC, p.id DESC
    
    LIMIT $2 OFFSET $3;
  `;

  const result = await db.query(query, [usuarioId, limit, offset]);
  return result.rows;
};

// apdate tag score for user when they interact with a character (like, favorite, etc.)
export const updateTagScore = async (usuarioId, characterId, actionType) => {
  console.log(`\n🔹 [TagScore] Chamado para: usuarioId=${usuarioId} | characterId=${characterId} | acao=${actionType}`);
  
  try {
    const resolvedCharacterId = await resolveCharacterId(characterId);
    const char = resolvedCharacterId ? await findDataCharacterById(resolvedCharacterId) : null;
    
    if (!char) {
      console.warn(`⚠️ [TagScore] Abortado: Personagem com identificador ${characterId} não existe no banco.`);
      return;
    }
    
    if (!char.tags_slugs || char.tags_slugs.length === 0) {
      console.warn(`⚠️ [TagScore] Abortado: O personagem "${char.nome}" existe, mas o array 'tags_slugs' está vazio ou nulo.`);
      return;
    }

    const weights = { view: 1, chat: 3, favorite: 10 };
    const scoreToAdd = weights[actionType] || 1;

    console.log(`🚀 [TagScore] Preparando para atualizar ${char.tags_slugs.length} tags com peso (+${scoreToAdd}) para as tags:`, char.tags_slugs);

    // Executa em paralelo
    await Promise.all(char.tags_slugs.map(async (tag) => {
      console.log(`   -> Enviando INSERT/UPDATE da tag [${tag}] para o banco...`);
      
      return db.query(`
        INSERT INTO personia2.user_tag_scores (usuario_id, tag_slug, score)
        VALUES ($1, $2, $3)
        ON CONFLICT (usuario_id, tag_slug) 
        DO UPDATE SET score = personia2.user_tag_scores.score + $3
      `, [usuarioId, tag, scoreToAdd]);
    }));

    console.log(`✅ [TagScore] Sucesso absoluto! Dados gravados no banco de dados.\n`);

  } catch (err) {
    console.error("❌ [TagScore] ERRO CRÍTICO AO MANDAR PARA O BANCO:", err);
  }
};
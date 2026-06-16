import db from '../../../config/db.js';
import { findDataCharacterById } from '../../characters/repositories/characterRepository.js';

// search popular characters of the week
export const findPopularWeek = async () => {
    const result = await db.query(`
     SELECT 
    p.id, 
    p.nome, 
    p.fotoia, 
    p.tipo_personagem, 
    p.usuario_id, 
    p.bio, 
    p.descricao, 
    p.visualizacoes,
    
    -- 1. Conta quantas linhas existem na sua tabela de favoritos para cada personagem
    COUNT(f.id) AS quantidade_favoritos,
    
    -- 2. CÁLCULO DO SCORE DA SEMANA:
    -- Cada visualização soma 1 ponto
    -- Cada favorito ganha um peso enorme de 15 pontos (mostra que o usuário gostou muito)
    (
      (COALESCE(p.visualizacoes, 0) * 1) + 
      (COUNT(f.id) * 15)
    ) AS score_popularidade

    FROM personia2.personagens p

    -- Faz o vínculo com a sua tabela de favoritos. 
    -- ATENÇÃO: Substitua 'personagens_favoritos' pelo nome REAL que você deu para essa tabela no banco
    LEFT JOIN personia2.favoritos f ON p.id = f.personagem_id

    -- Filtra os personagens que foram criados nos últimos 7 dias (Meteoro da semana)
    WHERE p.criado_em >= NOW() - INTERVAL '7 days'

    -- Agrupa os resultados pelo ID do personagem para que o COUNT consiga calcular os totais
    GROUP BY p.id

    -- Joga os maiores Scores para o topo e usa as visualizações como critério de desempate
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
      p.id, 
      p.nome, 
      p.fotoia, 
      p.bio, 
      p.usuario_id, 
      p.visualizacoes,
      -- Somamos os scores das tags para dar um "Super Score" caso combine com mais de uma tag
      SUM(uts.score) AS score_total
    FROM personia2.personagens p
    JOIN personia2.user_tag_scores uts ON uts.tag_slug = ANY(p.tags_slugs)
    WHERE uts.usuario_id = $1
    AND p.id NOT IN (
      SELECT personagem_id FROM personia2.recent_characters WHERE usuario_id = $1
    )
    -- O GROUP BY junta todas as linhas duplicadas do mesmo personagem em uma só
    GROUP BY p.id, p.nome, p.fotoia, p.bio, p.usuario_id, p.visualizacoes
    ORDER BY score_total DESC, p.id DESC
    
    -- Inserimos o LIMIT e o OFFSET de forma segura com placeholders do Postgres ($2 e $3)
    LIMIT $2 OFFSET $3;
  `;

  const result = await db.query(query, [usuarioId, limit, offset]);
  return result.rows;
};

// apdate tag score for user when they interact with a character (like, favorite, etc.)
export const updateTagScore = async (usuarioId, characterId, actionType) => {
  console.log(`\n🔹 [TagScore] Chamado para: usuarioId=${usuarioId} | characterId=${characterId} | acao=${actionType}`);
  
  try {
    const char = await findDataCharacterById(characterId);
    
    if (!char) {
      console.warn(`⚠️ [TagScore] Abortado: Personagem com ID ${characterId} não existe no banco.`);
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
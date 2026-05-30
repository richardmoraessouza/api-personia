import db from '../../../config/db.js';

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
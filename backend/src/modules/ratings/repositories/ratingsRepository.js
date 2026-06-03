import db from '../../../config/db.js';

/**
 * Fetch all available tags/categories registered in the system
 */
export const getAllTags = async () => {
  const query = `SELECT id, nome, slug FROM personia2.tags`;
  const result = await db.query(query);
  return result.rows;
};

/**
 * Link multiple tag IDs to a specific character (Ignores duplicates using ON CONFLICT)
 */
export const attachTagsToCharacter = async (characterId, tagIds) => {
  const query = `
    INSERT INTO personia2.personagem_tags (personagem_id, tag_id)
    SELECT $1, unnest($2::int[])
    ON CONFLICT DO NOTHING
  `;
  await db.query(query, [characterId, tagIds]);
};

/**
 * Remove all tag links from a character (Useful before reclassifying on updates)
 */
export const clearCharacterTags = async (characterId) => {
  const query = `DELETE FROM personia2.personagem_tags WHERE personagem_id = $1`;
  await db.query(query, [characterId]);
};

/**
 * Fetch characters linked to a specific tag slug, ordered by views and creation date
 */
/**
 * Busca personagens pela tag direto na tabela principal (SEM JOINs!)
 */
export const getCharactersByTagSlug = async (tagSlug, limit = 20, offset = 0) => {
  const query = `
    SELECT id, nome, fotoia, bio, descricao, visualizacoes, criado_em, tags_slugs
    FROM personia2.personagens
    WHERE $1 = ANY(tags_slugs) -- Procura o slug dentro do array de tags
    ORDER BY visualizacoes DESC, criado_em DESC
    LIMIT $2 OFFSET $3;
  `;
  
  const result = await db.query(query, [tagSlug, limit, offset]);
  return result.rows;
};

/**
 * Atualiza o array de slugs de tags direto na tabela do personagem
 */
export const updateCharacterTagsSlugs = async (characterId, slugs) => {
  const query = `
    UPDATE personia2.personagens 
    SET tags_slugs = $2
    WHERE id = $1
  `;
  await db.query(query, [characterId, slugs]);
};
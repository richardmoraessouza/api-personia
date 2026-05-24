import db from '../../../config/db.js';

export const getPersonagensByUsuarioId = async (usuarioId) => {
  const result = await db.query(`
    SELECT id, nome, fotoia, bio, tipo_personagem
    FROM personia2.personagens
    WHERE usuario_id = $1
  `, [usuarioId]);

  return result.rows;
};

// rota de mostrar os dados de um personagem específico
export const findDataPersonById = async (id) => {
  const result = await db.query(`
    SELECT * FROM personia2.personagens
    WHERE id = $1
  `, [id]);

  return result.rows[0] || null;
};

// rota para buscar personagem por nome
export const searchPersonagensByNome = async (nomePersonagem) => {
  const lowerTerm = `%${nomePersonagem.toLowerCase()}%`;
  const result = await db.query(`
    SELECT id, nome, fotoia, bio, tipo_personagem
    FROM personia2.personagens
    WHERE LOWER(nome) LIKE $1
  `, [lowerTerm]);

  return result.rows;
};

// rota para editar personagem
export const updatePersonById = async (id, person) => {
  const {
    nome,
    bio,
    genero,
    personalidade,
    comportamento,
    estilo,
    historia,
    fotoia,
    regras,
    descricao,
    obra,
    tipo_personagem,
    figurinhas
  } = person;

  const query = `
    UPDATE personia2.personagens
    SET
      nome = $1,
      bio = $2,
      genero = $3,
      personalidade = $4,
      comportamento = $5,
      estilo = $6,
      historia = $7,
      fotoia = $8,
      regras = $9,
      descricao = $10,
      obra = $11,
      tipo_personagem = $12,
      figurinhas = $13
    WHERE id = $14
    RETURNING *
  `;

  const values = [
    nome ?? null,
    bio ?? null,
    genero ?? null,
    personalidade ?? null,
    comportamento ?? null,
    estilo ?? null,
    historia ?? null,
    fotoia ?? null,
    regras ?? null,
    descricao ?? null,
    obra ?? null,
    tipo_personagem ?? null,
    figurinhas ?? null,
    id
  ];

  console.log(values);
  console.log(values.length);

  const result = await db.query(query, values);

  return result.rows[0] || null;
};

export const getPersonagensPaginated = async (limit, offset) => {
  const result = await db.query(`
    SELECT id, nome, fotoia, tipo_personagem, usuario_id, bio
    FROM personia2.personagens
    ORDER BY id
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  return result.rows;
};

// criação de personagem
export const createPerson = async (person) => {
  const {
    nome,
    genero,
    personalidade,
    comportamento,
    estilo,
    historia,
    fotoia,
    regras,
    usuario_id,
    usuarioId,
    descricao,
    feitos,
    obra,
    tipo_personagem,
    bio
  } = person;

  const userId = usuario_id || usuarioId;

  const result = await db.query(
    `INSERT INTO personia2.personagens 
     (nome, genero, personalidade, comportamento, estilo, historia, fotoia, regras, usuario_id, descricao, feitos, obra, tipo_personagem, bio)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      nome,
      genero,
      personalidade,
      comportamento,
      estilo,
      historia,
      fotoia,
      regras,
      userId,
      descricao,
      feitos,
      obra,
      tipo_personagem,
      bio
    ]
  );

  return result.rows[0];
}
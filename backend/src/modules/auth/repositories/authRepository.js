import db from '../../../config/db.js';


// =========================
// CRIAR USUÁRIO
// =========================

export const createUser = async ({
  gmail,
  nome,
  imgPerfil
}) => {

  const query = `
    INSERT INTO personia2.usuarios
    (
      gmail,
      nome,
      foto_perfil
    )
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const values = [
    gmail,
    nome,
    imgPerfil
  ];

  const result = await db.query(query, values);

  return result.rows[0];
};


// =========================
// LOGIN
// =========================

export const findUserByGmail = async (gmail) => {

  const query = `
    SELECT
      id,
      nome,
      gmail,
      foto_perfil,
      descricao
    FROM personia2.usuarios
    WHERE gmail = $1
  `;

  const result = await db.query(query, [ gmail ]);

  return result.rows[0];
};


// =========================
// BUSCAR GMAIL
// =========================


export const findUserPublicByGmail = async (gmail) => {

  const query = `
    SELECT
      gmail,
      nome,
      foto_perfil
    FROM personia2.usuarios
    WHERE gmail = $1
  `;

  const result = await db.query(query, [ gmail ]);

  return result.rows[0];
};
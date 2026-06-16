import db from '../../../config/db.js';


// =========================
// CREATE USER
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
      descricao,
      frame
    FROM personia2.usuarios
    WHERE gmail = $1
  `;

  const result = await db.query(query, [ gmail ]);

  return result.rows[0];
};


// =========================
// SEARCH BY EMAIL
// =========================


export const findUserPublicByGmail = async (gmail) => {

  const query = `
    SELECT
      gmail,
      nome,
      foto_perfil,
      frame
    FROM personia2.usuarios
    WHERE gmail = $1
  `;

  const result = await db.query(query, [ gmail ]);

  return result.rows[0];
};
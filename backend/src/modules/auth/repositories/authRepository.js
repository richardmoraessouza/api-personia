import db from '../../../config/db.js';


// =========================
// CREATE USER
// =========================

export const findUserByUsername = async (username) => {
  const query = `
    SELECT id, username
    FROM personia2.usuarios
    WHERE LOWER(username) = LOWER($1)
    LIMIT 1
  `;

  const result = await db.query(query, [username]);
  return result.rows[0];
};

export const createUser = async ({
  gmail,
  nome,
  imgPerfil,
  username
}) => {

  const query = `
    INSERT INTO personia2.usuarios
    (
      gmail,
      nome,
      foto_perfil,
      username
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const values = [
    gmail,
    nome,
    imgPerfil,
    username
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
      gmail,
      foto_perfil,
      descricao,
      frame,
      username
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
      username,
      foto_perfil,
      frame
    FROM personia2.usuarios
    WHERE gmail = $1
  `;

  const result = await db.query(query, [ gmail ]);

  return result.rows[0];
};
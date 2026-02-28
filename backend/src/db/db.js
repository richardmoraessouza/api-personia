import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false } 
});

// When the app starts we can create some helpful indexes if they don't
// already exist. This avoids long sequential scans on large tables and
// speeds up lookups by usuario_id and case‑insensitive name searches.
async function ensureIndexes() {
  try {
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_personagens_usuario_id
        ON personia2.personagens(usuario_id)`
    );
    // index on lower(nome) makes ILIKE and LOWER comparisons faster
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_personagens_nome_lower
        ON personia2.personagens(LOWER(nome))`
    );
    console.log('Índices verificados/instalados.');
    // ensure social tables indexed as well
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_favoritos_usuario_id
        ON personia2.favoritos(usuario_id)`
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_favoritos_personagem_id
        ON personia2.favoritos(personagem_id)`
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_likes_usuario_id
        ON personia2.likes(usuario_id)`
    );
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_likes_personagem_id
        ON personia2.likes(personagem_id)`
    );
  } catch (e) {
    console.error('Erro ao criar índices:', e);
  }
}

pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.stack);
    return;
  }
  console.log('Conectado ao banco!');
  release();
  // After we successfully connect we run the index setup once
  ensureIndexes();
});

export default pool;

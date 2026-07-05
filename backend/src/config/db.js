import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const isLocalhost = process.env.PGHOST?.includes('localhost') || process.env.PGHOST?.includes('127.0.0.1');

const pool = new Pool({
  host: process.env.PGHOST,
  port: 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: isLocalhost ? false : {
    rejectUnauthorized: false 
  }
});

// When the app starts we can create some helpful indexes if they don't
// already exist. This avoids long sequential scans on large tables and
// speeds up lookups by usuario_id and case‑insensitive name searches.
async function ensureIndexes() {
  try {
    // Create recent_characters table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personia2.recent_characters (
        usuario_id INTEGER NOT NULL,
        personagem_id INTEGER NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (usuario_id, personagem_id),
        FOREIGN KEY (usuario_id) REFERENCES personia2.usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (personagem_id) REFERENCES personia2.personagens(id) ON DELETE CASCADE
      )
    `)
    
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

async function ensureMissionTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personia2.mission (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        titulo TEXT NOT NULL,
        descricao TEXT,
        objetivo INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        ativa BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS personia2.user_missions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        mission_id INTEGER NOT NULL,
        progresso INTEGER DEFAULT 0,
        completada BOOLEAN DEFAULT FALSE,
        coletada_em TIMESTAMP NULL,
        data_atribuida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'personia2'
            AND table_name = 'user_missions'
            AND column_name = 'coletada_em'
        ) THEN
          ALTER TABLE personia2.user_missions
          ADD COLUMN coletada_em TIMESTAMP NULL;
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_missions_user_id_data
      ON personia2.user_missions (user_id, data_atribuida)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id
      ON personia2.user_missions (mission_id)
    `);
  } catch (e) {
    console.error('Erro ao criar/ajustar tabelas de missões:', e);
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
  ensureMissionTables();
});

// Helper functions for transactions
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;

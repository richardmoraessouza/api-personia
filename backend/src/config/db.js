import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const resolvedHost = process.env.PGHOST || process.env.DB_HOST || 'localhost';
const isLocalhost = resolvedHost.includes('localhost') || resolvedHost.includes('127.0.0.1');
const shouldUseSsl = process.env.PGSSLMODE === 'require' || process.env.PGSSL === 'true' || process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';

const pool = new Pool({
  host: resolvedHost,
  port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
  user: process.env.PGUSER || process.env.DB_USER || 'postgres',
  password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.PGDATABASE || process.env.DB_NAME || 'postgres',
  ssl: shouldUseSsl && !isLocalhost ? {
    rejectUnauthorized: false
  } : false
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

async function ensureUserPrivacyColumns() {
  try {
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'personia2'
            AND table_name = 'usuarios'
            AND column_name = 'hide_favorite_character'
        ) THEN
          ALTER TABLE personia2.usuarios
          ADD COLUMN hide_favorite_character BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'personia2'
            AND table_name = 'usuarios'
            AND column_name = 'hide_recent_character'
        ) THEN
          ALTER TABLE personia2.usuarios
          ADD COLUMN hide_recent_character BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'personia2'
            AND table_name = 'usuarios'
            AND column_name = 'hide_followers'
        ) THEN
          ALTER TABLE personia2.usuarios
          ADD COLUMN hide_followers BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'personia2'
            AND table_name = 'usuarios'
            AND column_name = 'hide_following'
        ) THEN
          ALTER TABLE personia2.usuarios
          ADD COLUMN hide_following BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `);
  } catch (e) {
    console.error('Erro ao criar colunas de privacidade:', e);
    throw e;
  }
}

async function ensureMessageMediaTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personia2.message_media (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES personia2.messages(id) ON DELETE CASCADE,
        media_type VARCHAR(50) DEFAULT 'audio',
        media_data TEXT,
        media_url TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_message_media_message_id
      ON personia2.message_media(message_id)
    `);
  } catch (e) {
    console.error('Erro ao criar tabela de mídia de mensagens:', e);
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

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    client.release();

    console.log('Conectado ao banco!');
    await ensureIndexes();
    await ensureUserPrivacyColumns();
    await ensureMessageMediaTable();
    await ensureMissionTables();
  } catch (error) {
    console.error('Erro ao inicializar o banco:', error);
    throw error;
  }
}

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

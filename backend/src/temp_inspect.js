const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();
const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false }
});
(async () => {
  const client = await pool.connect();
  try {
    const users = await client.query("SELECT id, nome, username FROM personia2.usuarios ORDER BY id LIMIT 10");
    const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='personia2' AND table_name='personagens' ORDER BY ordinal_position");
    console.log(JSON.stringify({ users: users.rows, columns: cols.rows.map(r => r.column_name) }, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
})();

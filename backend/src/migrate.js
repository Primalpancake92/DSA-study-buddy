import dotenv from 'dotenv';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabasePool } from './database.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const pool = createDatabasePool();
const migrationsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations');
const migrations = (await readdir(migrationsDirectory)).filter((file) => file.endsWith('.sql')).sort();
await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
for (const name of migrations) {
  const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
  if (applied.rowCount) continue;
  const migration = await readFile(path.join(migrationsDirectory, name), 'utf8');
  await pool.query('BEGIN');
  try { await pool.query(migration); await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]); await pool.query('COMMIT'); } catch (error) { await pool.query('ROLLBACK'); throw error; }
  console.log(`Applied ${name}`);
}
await pool.end();
console.log('Database migration complete.');

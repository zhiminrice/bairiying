require('dotenv').config();
const path = require('path');

// 生产环境（有 DATABASE_URL）→ PostgreSQL
// 本地开发 → SQLite
const isProduction = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

const production = {
  client: 'pg',
  connection: process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'sslmode=require',
  migrations: { directory: './migrations', tableName: 'knex_migrations' },
  seeds: { directory: './seeds' },
};

const development = {
  client: 'better-sqlite3',
  connection: { filename: path.join(__dirname, 'data', 'bairiying.db') },
  useNullAsDefault: true,
  pool: { afterCreate: (conn, cb) => { conn.pragma('journal_mode = WAL'); conn.pragma('foreign_keys = ON'); cb(); } },
  migrations: { directory: './migrations', tableName: 'knex_migrations' },
  seeds: { directory: './seeds' },
};

module.exports = isProduction ? production : development;

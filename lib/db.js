import 'server-only';
import { PRODUCTS } from './catalog';

// One query() function over two drivers:
//  - DATABASE_URL set  -> real PostgreSQL via `pg` (Neon, Vercel Postgres, Supabase, ...)
//  - DATABASE_URL unset -> embedded PGlite (local development only, stored in ./.pglite)

const g = globalThis;

async function getDriver() {
  if (g.__plzDriver) return g.__plzDriver;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) {
    const pgMod = await import('pg');
    const Pool = pgMod.Pool || pgMod.default.Pool;
    const needsSsl = !/localhost|127\.0\.0\.1/.test(url);
    const pool = new Pool({
      connectionString: url,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 3,
    });
    g.__plzDriver = { kind: 'postgres', query: (text, params) => pool.query(text, params) };
  } else {
    if (process.env.VERCEL) {
      throw new Error('DATABASE_URL is not configured. Add a Postgres database to this deployment.');
    }
    const { PGlite } = await import('@electric-sql/pglite');
    const pg = new PGlite(process.env.PGLITE_DIR || './.pglite');
    await pg.waitReady;
    g.__plzDriver = { kind: 'pglite', query: (text, params) => pg.query(text, params) };
  }
  return g.__plzDriver;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     email_verified BOOLEAN NOT NULL DEFAULT FALSE,
     welcome_sent BOOLEAN NOT NULL DEFAULT FALSE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS sessions (
     id TEXT PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     expires_at TIMESTAMPTZ NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS email_tokens (
     token TEXT PRIMARY KEY,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     purpose TEXT NOT NULL,
     expires_at TIMESTAMPTZ NOT NULL,
     used_at TIMESTAMPTZ)`,
  `CREATE TABLE IF NOT EXISTS products (
     id SERIAL PRIMARY KEY,
     slug TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     brand TEXT NOT NULL,
     gender TEXT NOT NULL,
     category TEXT NOT NULL,
     price INTEGER NOT NULL,
     mrp INTEGER NOT NULL,
     rating NUMERIC(2,1) NOT NULL DEFAULT 4.0,
     stock INTEGER NOT NULL DEFAULT 0,
     description TEXT NOT NULL,
     art JSONB NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS wishlist_items (
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (user_id, product_id))`,
  `CREATE TABLE IF NOT EXISTS cart_items (
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     qty INTEGER NOT NULL CHECK (qty > 0),
     PRIMARY KEY (user_id, product_id))`,
  `CREATE TABLE IF NOT EXISTS orders (
     id SERIAL PRIMARY KEY,
     order_no TEXT NOT NULL UNIQUE,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     subtotal INTEGER NOT NULL,
     shipping INTEGER NOT NULL,
     total INTEGER NOT NULL,
     status TEXT NOT NULL DEFAULT 'Confirmed',
     payment_method TEXT NOT NULL,
     ship_name TEXT NOT NULL,
     ship_phone TEXT NOT NULL,
     ship_address TEXT NOT NULL,
     ship_city TEXT NOT NULL,
     ship_pincode TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS order_items (
     id SERIAL PRIMARY KEY,
     order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
     product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
     name TEXT NOT NULL,
     price INTEGER NOT NULL,
     qty INTEGER NOT NULL,
     art JSONB)`,
  `CREATE TABLE IF NOT EXISTS email_log (
     id SERIAL PRIMARY KEY,
     user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
     kind TEXT NOT NULL,
     to_email TEXT NOT NULL,
     status TEXT NOT NULL,
     provider TEXT,
     detail TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
];

async function migrateAndSeed(driver) {
  for (const stmt of SCHEMA) await driver.query(stmt);
  for (const p of PRODUCTS) {
    await driver.query(
      `INSERT INTO products (slug, name, brand, gender, category, price, mrp, rating, stock, description, art)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, brand=EXCLUDED.brand, gender=EXCLUDED.gender,
         category=EXCLUDED.category, price=EXCLUDED.price, mrp=EXCLUDED.mrp, rating=EXCLUDED.rating,
         description=EXCLUDED.description, art=EXCLUDED.art`,
      [p.slug, p.name, p.brand, p.gender, p.category, p.price, p.mrp, p.rating, p.stock, p.description, JSON.stringify(p.art)]
    );
  }
}

async function ready() {
  if (!g.__plzReady) {
    g.__plzReady = (async () => {
      const d = await getDriver();
      await migrateAndSeed(d);
      return d;
    })().catch((e) => {
      g.__plzReady = null;
      throw e;
    });
  }
  return g.__plzReady;
}

export async function query(text, params = []) {
  const d = await ready();
  const res = await d.query(text, params);
  return res.rows;
}

export async function one(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export async function dbKind() {
  const d = await ready();
  return d.kind;
}

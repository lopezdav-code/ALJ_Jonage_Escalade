#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'pg';
import fs from 'fs';
import dns from 'dns/promises';

dotenv.config({ path: '.env.local' });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!databaseUrl) {
  // Fallback: try to parse .env.local manually (handles passwords with special chars)
  try {
    const raw = fs.readFileSync('.env.local', 'utf8');
    const m = raw.match(/^DATABASE_URL\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|(.*))$/m);
    const parsed = m ? (m[1] || m[2] || m[3]) : null;
    if (parsed) {
      // export into process.env for pg client
      process.env.DATABASE_URL = parsed.trim();
    }
  } catch (e) {
    // ignore and fall through to error
  }

  if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_URL) {
    console.error('Missing DATABASE_URL in .env.local or environment. Please set DATABASE_URL to your Postgres connection string.');
    process.exit(2);
  }
}

// Attempt to prefer IPv6 address if hostname resolves only to AAAA records
async function makeClient() {
  const connStr = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || databaseUrl;
  try {
    const url = new URL(connStr);
    const hostname = url.hostname;
    // try resolving IPv6 addresses
    let ipv6;
    try {
      const addrs = await dns.resolve6(hostname);
      if (addrs && addrs.length > 0) {
        ipv6 = addrs[0];
      }
    } catch (e) {
      // no AAAA or resolution failed, ignore and fall back
    }

    if (ipv6) {
      // build connection options using IPv6 address
      const opts = {
        host: ipv6,
        port: url.port ? parseInt(url.port, 10) : 5432,
        user: url.username || undefined,
        password: url.password || undefined,
        database: url.pathname ? url.pathname.replace(/^\//, '') : undefined,
        // Supabase requires SSL; let pg handle it. If SSL required, pg will negotiate.
        ssl: { rejectUnauthorized: false }
      };
      return new Client(opts);
    }
  } catch (e) {
    // ignore and fall back to connectionString mode
  }

  return new Client({ connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || databaseUrl });
}

let client;

const tables = ['secure_members','members','schedules'];

async function runQuery(q, params=[]) {
  const res = await client.query(q, params);
  return res.rows;
}

async function describe() {
  try {
    client = await makeClient();
    await client.connect();

    const colsQ = `
      SELECT table_name, column_name, data_type, is_nullable, character_maximum_length, column_default, ordinal_position
      FROM information_schema.columns
      WHERE table_name = ANY($1)
      ORDER BY table_name, ordinal_position;
    `;

    const indexesQ = `SELECT tablename, indexname, indexdef FROM pg_indexes WHERE tablename = ANY($1);`;

    const constraintsQ = `
      SELECT
        tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name,
        ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
      FROM information_schema.table_constraints AS tc
      LEFT JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = ANY($1);
    `;

    const cols = await runQuery(colsQ, [tables]);
    const indexes = await runQuery(indexesQ, [tables]);
    const constraints = await runQuery(constraintsQ, [tables]);

    console.log('COLUMNS:\n', JSON.stringify(cols, null, 2));
    console.log('\nINDEXES:\n', JSON.stringify(indexes, null, 2));
    console.log('\nCONSTRAINTS:\n', JSON.stringify(constraints, null, 2));

    await client.end();
  } catch (err) {
    console.error('Error describing schema:', err.message || err);
    try { await client.end(); } catch(e){}
    process.exit(4);
  }
}

describe();

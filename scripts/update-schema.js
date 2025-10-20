#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
dotenv.config();

// We prefer a SERVICE ROLE KEY for RPC that returns schema information.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL_EXTERNAL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment (.env.local).');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to call the get_schema RPC.');
  process.exit(2);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  global: { headers: { 'X-Client-Info': 'club-escalade-update-schema' } }
});

async function updateSchemaViaRpc() {
  try {
    console.log('Calling Supabase RPC get_schema()...');
    const { data, error } = await supabase.rpc('get_schema');
    if (error) {
      console.error('RPC error:', error.message || error);
      process.exit(3);
    }

    // The RPC should return JSON; some clients wrap it, so normalize
    const payload = data ?? null;
    if (!payload) {
      console.error('Empty response from get_schema RPC');
      process.exit(4);
    }

    // Write to schema.json
    const out = {
      generated_at: new Date().toISOString(),
      schema: payload
    };
    fs.writeFileSync('schema.json', JSON.stringify(out, null, 2));
    console.log('Wrote schema.json');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error calling Supabase RPC:', err.message || err);
    process.exit(5);
  }
}

updateSchemaViaRpc();

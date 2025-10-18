#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local first (if exists), then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Missing SUPABASE URL or ANON KEY. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local or environment.');
  process.exit(2);
}

const supabase = createClient(url, anonKey);

async function test() {
  try {
    console.log('Testing connection to Supabase:', url);
    const { data, error } = await supabase.from('sessions').select('id, date, start_time').limit(1);
    if (error) {
      console.error('Query error:', error.message || error);
      process.exit(3);
    }
    console.log('Success. Sample row:', data && data.length ? data[0] : 'no rows');
  } catch (err) {
    console.error('Unexpected error:', err.message || err);
    process.exit(4);
  }
}

test();

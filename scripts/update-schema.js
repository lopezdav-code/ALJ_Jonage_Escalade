#!/usr/bin/env node
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Call the Edge Function HTTP endpoint /functions/v1/get_schema_info
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL_EXTERNAL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment (.env.local).');
  process.exit(2);
}

const fnPath = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/get_schema_info`;

async function callEdgeFunction() {
  try {
    console.log(`Calling Edge Function ${fnPath} ...`);
    const res = await fetch(fnPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      },
      body: JSON.stringify({})
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error(`Edge function returned ${res.status} ${res.statusText}: ${txt}`);
      process.exit(3);
    }

    const payload = await res.json();
    if (!payload) {
      console.error('Empty payload from edge function');
      process.exit(4);
    }

    const out = { generated_at: new Date().toISOString(), schema: payload };
    fs.writeFileSync('schema.json', JSON.stringify(out, null, 2));
    console.log('Wrote schema.json');
    process.exit(0);
  } catch (err) {
    console.error('Error calling Edge Function:', err.message || err);
    process.exit(5);
  }
}

callEdgeFunction();

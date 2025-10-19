#!/usr/bin/env node
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL in .env.local');
  process.exit(2);
}

const key = SERVICE_KEY || ANON_KEY;
if (!key) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(2);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

async function fetchTable(table, params = '') {
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}${params}`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    const json = await res.json();
    return json;
  } catch (err) {
    throw new Error(`Error fetching ${table}: ${err.message}`);
  }
}

async function main() {
  try {
    console.log('Fetching sample rows via Supabase REST API...');
    const members = await fetchTable('members', '?select=*&limit=100');
    const secureMembers = await fetchTable('secure_members', '?select=*&limit=100');
    const schedules = await fetchTable('schedules', '?select=*&limit=500');

    const out = { members_count: members.length, secure_members_count: secureMembers.length, schedules_count: schedules.length, members, secureMembers, schedules };
    // Pretty-print but avoid super large output by trimming long text fields
    const json = JSON.stringify(out, null, 2);
    fs.writeFileSync('tmp/supabase-rest-sample.json', json);
    console.log('Wrote tmp/supabase-rest-sample.json');
    console.log('Summary:', { members: members.length, secure_members: secureMembers.length, schedules: schedules.length });
  } catch (err) {
    console.error(err.message);
    process.exit(3);
  }
}

// ensure tmp dir
try { fs.mkdirSync('tmp', { recursive: true }); } catch(e) {}

main();

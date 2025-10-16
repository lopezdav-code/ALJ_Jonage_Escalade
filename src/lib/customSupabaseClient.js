import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://hvugiirundpxynozxxnd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dWdpaXJ1bmRweHlub3p4eG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTM0NjYsImV4cCI6MjA3NDgyOTQ2Nn0.aEH6Lp5B8qceXfY-uLIPJJYoE-ecUq78beLBcyD-bww';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'club-escalade-app'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

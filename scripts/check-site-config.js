import { supabase } from '../src/lib/customSupabaseClient.js';

async function checkSiteConfig() {
  console.log('🔍 Checking site_config table...');
  
  const { data, error } = await supabase
    .from('site_config')
    .select('*')
    .limit(5);
    
  if (error) {
    console.error('❌ Error checking site_config:', error);
    if (error.code === '42P01') {
      console.log('🔨 Table site_config does not exist. Suggesting creation...');
    }
  } else {
    console.log('✅ Table site_config exists!');
    console.log('📊 Data sample:', data);
  }
}

checkSiteConfig();

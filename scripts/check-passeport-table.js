import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Vérification de la structure de la table passeport_validations...\n');

// Lire la structure actuelle
const { data, error } = await supabase
  .from('passeport_validations')
  .select('*')
  .limit(1);

if (error) {
  console.error('❌ Erreur:', error.message);
} else {
  console.log('✅ Table accessible');
  if (data && data.length > 0) {
    console.log('\n📊 Colonnes détectées:', Object.keys(data[0]).join(', '));
    console.log('\n⚠️  Pour ajouter la colonne "module", utilisez le SQL Editor de Supabase:');
    console.log('   1. Ouvrez https://supabase.com/dashboard');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans "SQL Editor"');
    console.log('   4. Collez le contenu de: scripts/supabase-add-module-column.sql');
    console.log('   5. Cliquez sur "Run"');
  }
}

process.exit(0);

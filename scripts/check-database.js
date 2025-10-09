// Script pour vérifier et créer la table vocabulary_sheets
import { supabase } from '../src/lib/customSupabaseClient.js';

async function checkAndCreateTable() {
  console.log('🔍 Vérification de la base de données...');
  
  try {
    // Vérifier si la table existe en essayant de la lire
    console.log('📋 Test de la table vocabulary_sheets...');
    const { data, error } = await supabase
      .from('vocabulary_sheets')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ La table vocabulary_sheets n\'existe pas');
        console.log('🔨 Création de la table...');
        
        // Créer la table via SQL
        const { error: createError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS vocabulary_sheets (
              id SERIAL PRIMARY KEY,
              pedagogy_sheet_id INTEGER REFERENCES pedagogy_sheets(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
              UNIQUE(pedagogy_sheet_id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_vocabulary_sheets_pedagogy_sheet_id 
            ON vocabulary_sheets(pedagogy_sheet_id);
            
            CREATE INDEX IF NOT EXISTS idx_vocabulary_sheets_created_at 
            ON vocabulary_sheets(created_at);
          `
        });
        
        if (createError) {
          console.log('🛠️  Tentative de création manuelle via requête SQL...');
          
          // Fallback : essayer une création plus simple
          const { error: simpleCreateError } = await supabase
            .from('vocabulary_sheets')
            .insert([{ pedagogy_sheet_id: 1 }]);
            
          console.log('❌ Erreur lors de la création:', createError);
          console.log('💡 Solution: Créez manuellement la table dans Supabase');
          console.log('📄 Utilisez le script SQL dans: scripts/create-vocabulary-sheets-table.sql');
        } else {
          console.log('✅ Table créée avec succès !');
        }
      } else {
        console.log('❌ Erreur inattendue:', error);
      }
    } else {
      console.log('✅ La table vocabulary_sheets existe et fonctionne !');
      console.log(`📊 Nombre d'enregistrements: ${data?.length || 0}`);
    }
    
    // Vérifier la table pedagogy_sheets
    console.log('\n📋 Vérification de la table pedagogy_sheets...');
    const { data: pedagogyData, error: pedagogyError } = await supabase
      .from('pedagogy_sheets')
      .select('id, title')
      .limit(5);
      
    if (pedagogyError) {
      console.log('❌ Erreur avec pedagogy_sheets:', pedagogyError);
    } else {
      console.log(`✅ Table pedagogy_sheets OK - ${pedagogyData?.length || 0} fiches trouvées`);
      if (pedagogyData?.length > 0) {
        console.log('📋 Premières fiches:', pedagogyData.map(s => s.title).join(', '));
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

checkAndCreateTable();
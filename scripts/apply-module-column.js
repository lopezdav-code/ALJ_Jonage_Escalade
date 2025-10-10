import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, description) {
  console.log(`\n📋 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Erreur: ${error.message}`);
      return false;
    }
    
    console.log(`✅ ${description} - Succès`);
    if (data) {
      console.log('   Données:', JSON.stringify(data, null, 2));
    }
    return true;
  } catch (err) {
    console.error(`❌ Exception: ${err.message}`);
    return false;
  }
}

async function applyModuleColumn() {
  console.log('🚀 Début de l\'ajout de la colonne module...\n');
  
  // 1. Vérifier la structure actuelle de la table
  console.log('📊 Vérification de la structure actuelle...');
  const { data: columns, error: checkError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'passeport_validations');
  
  if (!checkError && columns) {
    console.log('Colonnes actuelles:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    const hasModuleColumn = columns.some(col => col.column_name === 'module');
    if (hasModuleColumn) {
      console.log('\n⚠️  La colonne "module" existe déjà!');
      console.log('   Voulez-vous continuer avec les index et contraintes? (Tapez Ctrl+C pour annuler)');
    }
  }
  
  // 2. Ajouter la colonne module
  const sqlAddColumn = `
    ALTER TABLE passeport_validations
    ADD COLUMN IF NOT EXISTS module VARCHAR(20);
  `;
  
  await executeSQL(sqlAddColumn, 'Ajout de la colonne module');
  
  // 3. Ajouter le commentaire
  const sqlComment = `
    COMMENT ON COLUMN passeport_validations.module IS 
    'Module validé: bloc (salle de bloc) ou difficulte (salle d escalade avec cordes)';
  `;
  
  await executeSQL(sqlComment, 'Ajout du commentaire sur la colonne');
  
  // 4. Créer l'index sur module
  const sqlIndexModule = `
    CREATE INDEX IF NOT EXISTS idx_passeport_validations_module
    ON passeport_validations(module);
  `;
  
  await executeSQL(sqlIndexModule, 'Création de l\'index sur module');
  
  // 5. Créer l'index composé
  const sqlIndexCompose = `
    CREATE INDEX IF NOT EXISTS idx_passeport_validations_member_niveau_module
    ON passeport_validations(member_id, niveau, module);
  `;
  
  await executeSQL(sqlIndexCompose, 'Création de l\'index composé (member_id, niveau, module)');
  
  // 6. Ajouter la contrainte CHECK
  console.log('\n📋 Ajout de la contrainte CHECK...');
  const sqlConstraint = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_module_values'
      ) THEN
        ALTER TABLE passeport_validations
        ADD CONSTRAINT check_module_values
        CHECK (module IN ('bloc', 'difficulte'));
      ELSE
        RAISE NOTICE 'La contrainte check_module_values existe déjà';
      END IF;
    END $$;
  `;
  
  await executeSQL(sqlConstraint, 'Ajout de la contrainte CHECK');
  
  // 7. Vérifier la structure finale
  console.log('\n📊 Vérification de la structure finale...');
  const { data: finalColumns, error: finalError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, character_maximum_length, is_nullable')
    .eq('table_name', 'passeport_validations')
    .order('ordinal_position');
  
  if (!finalError && finalColumns) {
    console.log('\n✅ Structure finale de la table passeport_validations:');
    console.table(finalColumns);
  }
  
  // 8. Vérifier les index
  console.log('\n📊 Index sur la table:');
  const { data: indexes } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'passeport_validations'
      AND indexname LIKE '%module%';
    `
  });
  
  if (indexes) {
    console.log(indexes);
  }
  
  console.log('\n✅ Migration terminée avec succès!');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Tester la validation d\'un passeport avec module');
  console.log('   2. Mettre à jour PasseportViewer pour afficher les modules');
  console.log('   3. Adapter les requêtes de filtrage dans PasseportValidation');
}

// Exécution
applyModuleColumn()
  .then(() => {
    console.log('\n🎉 Script terminé');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Erreur fatale:', err);
    process.exit(1);
  });

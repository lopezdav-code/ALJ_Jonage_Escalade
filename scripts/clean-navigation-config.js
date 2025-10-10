// Script pour nettoyer la configuration de navigation
// Supprime le sous-menu de "Fiches Pédagogiques"

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanNavigationConfig() {
  console.log('🧹 Nettoyage de la configuration de navigation...');

  try {
    // Récupérer la configuration actuelle
    const { data: currentConfig, error: fetchError } = await supabase
      .from('site_config')
      .select('*')
      .eq('key', 'nav_config')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (currentConfig) {
      console.log('📋 Configuration actuelle trouvée');
      console.log(JSON.stringify(JSON.parse(currentConfig.value), null, 2));
    } else {
      console.log('ℹ️  Aucune configuration de navigation en base de données');
      return;
    }

    // Supprimer la configuration pour forcer l'utilisation de la config par défaut
    const { error: deleteError } = await supabase
      .from('site_config')
      .delete()
      .eq('key', 'nav_config');

    if (deleteError) throw deleteError;

    console.log('✅ Configuration de navigation supprimée avec succès');
    console.log('📌 La navigation utilisera maintenant la configuration par défaut du code');
    console.log('🔄 Rechargez votre navigateur pour voir les changements');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

cleanNavigationConfig();

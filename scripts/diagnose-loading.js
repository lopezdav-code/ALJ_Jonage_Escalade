// Script de diagnostic pour les problèmes de chargement
import { supabase } from '../src/lib/customSupabaseClient.js';

async function diagnoseLoadingIssues() {
  console.log('🔍 Diagnostic des problèmes de chargement...\n');
  
  // Test 1: Connexion Supabase
  console.log('📡 Test de connexion Supabase...');
  try {
    const { data, error } = await supabase.from('pedagogy_sheets').select('count').limit(1);
    if (error) {
      console.log('❌ Erreur Supabase:', error.message);
    } else {
      console.log('✅ Connexion Supabase OK');
    }
  } catch (e) {
    console.log('❌ Erreur connexion:', e.message);
  }
  
  // Test 2: Session d'authentification
  console.log('\n🔐 Test de session d\'authentification...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Erreur session:', error.message);
    } else {
      console.log(session ? '✅ Session trouvée' : '⚠️ Pas de session (normal si pas connecté)');
    }
  } catch (e) {
    console.log('❌ Erreur session:', e.message);
  }
  
  // Test 3: Tables principales
  console.log('\n📊 Test des tables principales...');
  const tables = ['pedagogy_sheets', 'competitions', 'members'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.log(`❌ Table ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table}: ${data?.length || 0} enregistrement(s) testé(s)`);
      }
    } catch (e) {
      console.log(`❌ Table ${table}:`, e.message);
    }
  }
  
  // Test 4: Temps de réponse
  console.log('\n⏱️ Test des temps de réponse...');
  const start = Date.now();
  try {
    await supabase.from('pedagogy_sheets').select('id, title').limit(5);
    const duration = Date.now() - start;
    console.log(`✅ Requête terminée en ${duration}ms`);
    if (duration > 3000) {
      console.log('⚠️ Temps de réponse lent (>3s) - possible cause du problème');
    }
  } catch (e) {
    console.log('❌ Test temps de réponse échoué:', e.message);
  }
  
  console.log('\n🎯 Résumé:');
  console.log('- Si toutes les connexions sont OK, le problème vient de la gestion d\'état React');
  console.log('- Si les temps de réponse sont lents, c\'est un problème réseau/Supabase');
  console.log('- Vérifiez la console navigateur pour plus de détails');
}

diagnoseLoadingIssues();
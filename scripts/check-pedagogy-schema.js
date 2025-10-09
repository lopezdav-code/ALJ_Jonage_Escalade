// Script pour vérifier le schéma de la table pedagogy_sheets
import { supabase } from '../src/lib/customSupabaseClient.js';

async function checkPedagogyTableSchema() {
  console.log('🔍 Vérification du schéma de pedagogy_sheets...');
  
  try {
    // Récupérer quelques enregistrements pour voir la structure
    const { data, error } = await supabase
      .from('pedagogy_sheets')
      .select('id, title, type, sheet_type')
      .limit(3);
    
    if (error) {
      console.log('❌ Erreur:', error);
      return;
    }
    
    console.log('✅ Données récupérées:');
    console.log('📊 Nombre d\'enregistrements:', data.length);
    
    if (data.length > 0) {
      console.log('\n📋 Structure des données:');
      data.forEach((item, index) => {
        console.log(`\n--- Enregistrement ${index + 1} ---`);
        console.log('ID:', item.id, '(type:', typeof item.id, ')');
        console.log('Title:', item.title);
        console.log('Type:', item.type);
        console.log('Sheet Type:', item.sheet_type);
      });
      
      // Analyser le type de l'ID
      const firstId = data[0].id;
      console.log('\n🔍 Analyse de l\'ID:');
      console.log('Valeur:', firstId);
      console.log('Type JavaScript:', typeof firstId);
      console.log('Longueur:', firstId.toString().length);
      
      // Déterminer si c'est un UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isUuid = uuidRegex.test(firstId);
      
      console.log('Format UUID:', isUuid ? '✅ OUI' : '❌ NON');
      
      if (isUuid) {
        console.log('\n💡 Solution: Utiliser uuid pour pedagogy_sheet_id');
      } else {
        console.log('\n💡 Solution: Utiliser bigint pour pedagogy_sheet_id');
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

checkPedagogyTableSchema();
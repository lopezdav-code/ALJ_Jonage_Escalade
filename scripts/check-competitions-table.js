import { supabase } from '../src/lib/customSupabaseClient.js';

const checkCompetitionsTable = async () => {
  console.log('🔍 Vérification de la structure de la table competitions...');
  
  // Récupérer quelques compétitions pour voir la structure
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Erreur:', error);
  } else {
    console.log('✅ Structure de la table competitions:');
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('Colonnes disponibles:', columns);
      
      // Vérifier spécifiquement les colonnes problématiques
      const problemColumns = ['details_pratiques', 'details_format'];
      problemColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`✅ Colonne '${col}' trouvée`);
        } else {
          console.log(`❌ Colonne '${col}' MANQUANTE`);
        }
      });
    } else {
      console.log('Aucune compétition trouvée pour analyser la structure');
    }
  }
};

checkCompetitionsTable();
// Script pour créer la table vocabulary_sheets dans Supabase
// À exécuter une seule fois pour initialiser la base de données

import { supabase } from '../src/lib/customSupabaseClient.js';

async function createVocabularyTable() {
  console.log('Création de la table vocabulary_sheets...');
  
  try {
    // Créer la table vocabulary_sheets
    const { error } = await supabase.rpc('create_vocabulary_sheets_table');
    
    if (error) {
      console.error('Erreur lors de la création de la table:', error);
      
      // Fallback : créer via une requête SQL directe si la fonction n'existe pas
      const { error: sqlError } = await supabase
        .from('vocabulary_sheets')
        .select('id')
        .limit(1);
        
      if (sqlError && sqlError.code === '42P01') { // Table doesn't exist
        console.log('La table n\'existe pas. Veuillez créer la table manuellement avec le script SQL fourni.');
        console.log('Fichier: scripts/create-vocabulary-sheets-table.sql');
      } else {
        console.log('La table vocabulary_sheets existe déjà ou erreur différente:', sqlError);
      }
    } else {
      console.log('Table vocabulary_sheets créée avec succès !');
    }
    
    // Test de la table
    const { data, error: testError } = await supabase
      .from('vocabulary_sheets')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('Erreur lors du test de la table:', testError);
    } else {
      console.log('Table vocabulary_sheets opérationnelle !');
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

// Exécuter la fonction
createVocabularyTable();
/*
 * Script pour ajouter la colonne 'module' à la table passeport_validations
 * 
 * INSTRUCTIONS:
 * 1. Ouvrez Supabase Dashboard: https://supabase.com/dashboard
 * 2. Sélectionnez votre projet
 * 3. Allez dans SQL Editor (dans le menu de gauche)
 * 4. Créez une nouvelle requête
 * 5. Copiez-collez le SQL ci-dessous
 * 6. Cliquez sur "Run" pour exécuter
 */

-- ============================================
-- ÉTAPE 1: Ajouter la colonne module
-- ============================================

ALTER TABLE passeport_validations
ADD COLUMN IF NOT EXISTS module VARCHAR(20);

COMMENT ON COLUMN passeport_validations.module IS 
'Module validé: bloc (salle de bloc) ou difficulte (salle d escalade avec cordes)';

-- ============================================
-- ÉTAPE 2: Créer les index pour la performance
-- ============================================

-- Index simple sur module
CREATE INDEX IF NOT EXISTS idx_passeport_validations_module
ON passeport_validations(module);

-- Index composé pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_passeport_validations_member_type_module
ON passeport_validations(member_id, passeport_type, module);

-- ============================================
-- ÉTAPE 3: Ajouter la contrainte de validation
-- ============================================

-- Supprimer la contrainte si elle existe déjà
ALTER TABLE passeport_validations
DROP CONSTRAINT IF EXISTS check_module_values;

-- Ajouter la nouvelle contrainte
ALTER TABLE passeport_validations
ADD CONSTRAINT check_module_values
CHECK (module IS NULL OR module IN ('bloc', 'difficulte'));

-- ============================================
-- ÉTAPE 4: Vérification
-- ============================================

-- Afficher la structure de la table
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'passeport_validations'
ORDER BY ordinal_position;

-- Afficher les index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'passeport_validations'
ORDER BY indexname;

-- Afficher les contraintes
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'passeport_validations'::regclass
ORDER BY conname;

-- ============================================
-- ÉTAPE 5: Test d'insertion (optionnel)
-- ============================================

-- Test: Vérifier qu'on peut insérer avec module = 'bloc'
-- Décommentez pour tester (remplacez les valeurs par des vraies données)
/*
INSERT INTO passeport_validations (
  member_id, 
  niveau, 
  module,
  date_validation, 
  validateur,
  competences_validees
) VALUES (
  'uuid-du-membre',
  'blanc',
  'bloc',
  NOW(),
  'Nom Validateur',
  '{}'::jsonb
);
*/

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
/*
✅ La table passeport_validations devrait maintenant avoir:
   - Colonne 'module' de type VARCHAR(20), nullable
   - Index idx_passeport_validations_module
   - Index idx_passeport_validations_member_niveau_module
   - Contrainte check_module_values acceptant: NULL, 'bloc', 'difficulte'
*/

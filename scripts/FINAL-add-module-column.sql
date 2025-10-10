/*
 * ✅ SQL CORRIGÉ - Ajout de la colonne module
 * 
 * ERREUR CORRIGÉE: "niveau" n'existe pas → Utiliser "passeport_type"
 * 
 * Exécutez ce SQL dans Supabase SQL Editor
 */

-- ============================================
-- ÉTAPE 1: Ajouter la colonne module
-- ============================================

ALTER TABLE passeport_validations
ADD COLUMN IF NOT EXISTS module VARCHAR(20);

COMMENT ON COLUMN passeport_validations.module IS 
'Module validé: bloc (salle de bloc) ou difficulte (salle d escalade avec cordes)';

-- ============================================
-- ÉTAPE 2: Créer l'index simple sur module
-- ============================================

CREATE INDEX IF NOT EXISTS idx_passeport_validations_module
ON passeport_validations(module);

-- ============================================
-- ÉTAPE 3: Créer l'index composé CORRIGÉ
-- ============================================

-- ❌ ANCIEN (ERREUR): ON passeport_validations(member_id, niveau, module);
-- ✅ NOUVEAU (CORRECT):

CREATE INDEX IF NOT EXISTS idx_passeport_validations_member_type_module
ON passeport_validations(member_id, passeport_type, module);

-- ============================================
-- ÉTAPE 4: Ajouter la contrainte CHECK
-- ============================================

-- Supprimer si existe déjà
ALTER TABLE passeport_validations
DROP CONSTRAINT IF EXISTS check_module_values;

-- Créer la contrainte
ALTER TABLE passeport_validations
ADD CONSTRAINT check_module_values
CHECK (module IS NULL OR module IN ('bloc', 'difficulte'));

-- ============================================
-- ÉTAPE 5: Vérification
-- ============================================

-- Afficher la structure de la table
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
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

-- ============================================
-- ✅ RÉSULTAT ATTENDU
-- ============================================
/*
La table passeport_validations devrait avoir:
  ✓ Colonne 'module' VARCHAR(20) NULL
  ✓ Index: idx_passeport_validations_module
  ✓ Index: idx_passeport_validations_member_type_module
  ✓ Contrainte: check_module_values (NULL, 'bloc', 'difficulte')
*/

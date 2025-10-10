-- Ajouter la colonne 'module' à la table passeport_validations
-- Cette colonne permet de distinguer les validations par module (bloc ou difficulté)

ALTER TABLE passeport_validations
ADD COLUMN IF NOT EXISTS module VARCHAR(20);

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN passeport_validations.module IS 'Module validé: bloc (salle de bloc) ou difficulte (salle d escalade)';

-- Créer un index pour améliorer les performances des requêtes filtrées par module
CREATE INDEX IF NOT EXISTS idx_passeport_validations_module 
ON passeport_validations(module);

-- Créer un index composé pour les requêtes fréquentes (membre + passeport_type + module)
CREATE INDEX IF NOT EXISTS idx_passeport_validations_member_type_module 
ON passeport_validations(member_id, passeport_type, module);

-- Ajouter une contrainte pour valider les valeurs possibles du module
ALTER TABLE passeport_validations
ADD CONSTRAINT check_module_values 
CHECK (module IN ('bloc', 'difficulte', NULL));

-- Afficher la structure mise à jour
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'passeport_validations'
ORDER BY ordinal_position;

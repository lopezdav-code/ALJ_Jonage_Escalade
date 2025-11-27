-- Migration: Permettre la valeur INCONNU pour les prénoms non reconnus
-- Date: 2025-11-23
-- Description: Modifie la contrainte CHECK pour permettre 'INCONNU' comme valeur de genre

-- Modifier la contrainte CHECK pour permettre 'INCONNU'
ALTER TABLE firstname_gender_mapping
DROP CONSTRAINT firstname_gender_mapping_gender_check;

ALTER TABLE firstname_gender_mapping
ADD CONSTRAINT firstname_gender_mapping_gender_check
CHECK (gender IN ('Masculin', 'Féminin', 'Mixte', 'INCONNU'));

-- Commentaire mis à jour
COMMENT ON COLUMN firstname_gender_mapping.gender IS 'Sexe: Masculin, Féminin, Mixte, ou INCONNU (pour les prénoms non reconnus)';

-- Migration: Verrouiller le N° de dossart après création
-- Date: 2025-11-17
-- Description: Empêche la modification du numero_dossart après sa création initiale

-- Étape 1: Ajouter une contrainte UNIQUE sur numero_dossart (si nécessaire)
-- Cette contrainte empêche les doublons
ALTER TABLE competition_registrations
ADD CONSTRAINT unique_numero_dossart UNIQUE (numero_dossart) WHERE numero_dossart IS NOT NULL;

-- Étape 2: Créer un trigger pour empêcher la modification du numero_dossart
CREATE OR REPLACE FUNCTION prevent_dossard_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le numero_dossart existait déjà et qu'on essaie de le modifier
  IF OLD.numero_dossart IS NOT NULL AND NEW.numero_dossart IS DISTINCT FROM OLD.numero_dossart THEN
    RAISE EXCEPTION 'Le numéro de dossard ne peut pas être modifié après sa création. Ancien: %, Nouveau: %',
      OLD.numero_dossart, NEW.numero_dossart;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_prevent_dossard_update ON competition_registrations;
CREATE TRIGGER trigger_prevent_dossard_update
  BEFORE UPDATE ON competition_registrations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_dossard_update();

-- Commentaires
COMMENT ON FUNCTION prevent_dossard_update() IS 'Fonction trigger pour empêcher la modification du numero_dossart après sa création';

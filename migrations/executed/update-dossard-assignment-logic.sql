-- Migration: Mise à jour de la logique d'assignation des numéros de dossard
-- Date: 2025-11-17
-- Description: Assigne les numéros de dossard en fonction de l'horaire
--   - MATIN (U9-U11-U13): numéros 1-500
--   - APRÈS-MIDI (U15-U17-U19): numéros 501-999

-- Étape 1: Créer la nouvelle fonction
CREATE OR REPLACE FUNCTION assign_dossard_numbers()
RETURNS void AS $$
DECLARE
  next_matin INTEGER := 1;        -- Matin: 1-500
  next_apres_midi INTEGER := 501; -- Après-midi: 501-999
  reg RECORD;
BEGIN
  -- Assigner les numéros de dossards pour le MATIN (U9-U11-U13)
  -- Range: 1-500
  FOR reg IN
    SELECT id
    FROM competition_registrations
    WHERE numero_dossart IS NULL
      AND horaire = 'matin'
    ORDER BY created_at, id
  LOOP
    -- Vérifier que nous ne dépassons pas 500
    IF next_matin > 500 THEN
      RAISE EXCEPTION 'Trop de participants pour le matin (max 500). Actuellement: %', next_matin;
    END IF;

    UPDATE competition_registrations
    SET numero_dossart = next_matin
    WHERE id = reg.id;

    next_matin := next_matin + 1;
  END LOOP;

  -- Assigner les numéros de dossards pour l'APRÈS-MIDI (U15-U17-U19)
  -- Range: 501-999
  FOR reg IN
    SELECT id
    FROM competition_registrations
    WHERE numero_dossart IS NULL
      AND horaire = 'après-midi'
    ORDER BY created_at, id
  LOOP
    -- Vérifier que nous ne dépassons pas 999
    IF next_apres_midi > 999 THEN
      RAISE EXCEPTION 'Trop de participants pour l''après-midi (max 999). Actuellement: %', next_apres_midi;
    END IF;

    UPDATE competition_registrations
    SET numero_dossart = next_apres_midi
    WHERE id = reg.id;

    next_apres_midi := next_apres_midi + 1;
  END LOOP;

  -- Les inscriptions Buvette (horaire IS NULL) ne reçoivent pas de numéro de dossard
END;
$$ LANGUAGE plpgsql;

-- Étape 2 (OPTIONNEL): Réinitialiser et réassigner les numéros existants
-- Décommenter la section suivante uniquement si vous voulez réassigner TOUS les dossards
-- ATTENTION: Ceci supprimera tous les numéros existants et les réassignera !
/*
UPDATE competition_registrations SET numero_dossart = NULL WHERE horaire IS NOT NULL;
SELECT assign_dossard_numbers();
*/

-- Étape 3: Vérifier les résultats
-- Décommenter pour voir la distribution des numéros
/*
SELECT
  horaire,
  COUNT(*) as total,
  MIN(numero_dossart) as min_dossart,
  MAX(numero_dossart) as max_dossart
FROM competition_registrations
WHERE numero_dossart IS NOT NULL
GROUP BY horaire
ORDER BY horaire;
*/

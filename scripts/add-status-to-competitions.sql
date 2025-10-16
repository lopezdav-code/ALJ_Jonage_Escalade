-- Script SQL pour ajouter le champ status à la table competitions
-- Date: 2025-10-15
-- Description: Ajout d'un champ status avec 3 valeurs possibles: 'À venir', 'En cours', 'Clos'

-- Étape 1: Ajouter la colonne status avec une valeur par défaut
ALTER TABLE competitions
ADD COLUMN status TEXT NOT NULL DEFAULT 'À venir';

-- Étape 2: Ajouter une contrainte pour limiter les valeurs possibles
ALTER TABLE competitions
ADD CONSTRAINT competitions_status_check
CHECK (status IN ('À venir', 'En cours', 'Clos'));

-- Étape 3: Créer un index pour améliorer les performances des requêtes filtrées par status
CREATE INDEX idx_competitions_status ON competitions(status);

-- Étape 4: Mettre à jour automatiquement les compétitions passées en "Clos"
-- (Optionnel: ajuster la date selon vos besoins)
UPDATE competitions
SET status = 'Clos'
WHERE start_date < CURRENT_DATE - INTERVAL '7 days';

-- Étape 5: Mettre à jour les compétitions récentes en "En cours"
-- (Optionnel: ajuster selon vos critères)
UPDATE competitions
SET status = 'En cours'
WHERE start_date >= CURRENT_DATE - INTERVAL '7 days'
  AND start_date <= CURRENT_DATE + INTERVAL '7 days';

-- Vérification: Afficher la distribution des statuts
SELECT status, COUNT(*) as count
FROM competitions
GROUP BY status
ORDER BY
  CASE status
    WHEN 'En cours' THEN 1
    WHEN 'À venir' THEN 2
    WHEN 'Clos' THEN 3
  END;

-- Commentaire sur la colonne
COMMENT ON COLUMN competitions.status IS 'Statut de la compétition: À venir, En cours, ou Clos';

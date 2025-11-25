-- Optimisation des performances pour la page compétitions

-- 1. Index pour le tri par date (utilisé par défaut sur la page)
CREATE INDEX IF NOT EXISTS idx_competitions_start_date ON competitions(start_date DESC);

-- 2. Index pour le filtrage par statut
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);

-- 3. Index pour optimiser le comptage des participants
-- Cet index couvre la clé étrangère et la colonne utilisée pour le filtrage (role)
CREATE INDEX IF NOT EXISTS idx_competition_participants_comp_role ON competition_participants(competition_id, role);

-- 4. Vue pour pré-calculer le nombre de participants par compétition
-- Cette vue évite de charger toute la table competition_participants côté client
CREATE OR REPLACE VIEW competition_stats AS
SELECT 
    competition_id, 
    COUNT(*) as participant_count
FROM 
    competition_participants
WHERE 
    LOWER(role) IN ('competiteur', 'compétiteur')
GROUP BY 
    competition_id;

-- Commentaire:
-- Pour utiliser cette vue dans l'application, vous pouvez remplacer la requête 
-- sur competition_participants par une requête sur competition_stats.
-- Exemple JS:
-- const { data } = await supabase.from('competition_stats').select('*');

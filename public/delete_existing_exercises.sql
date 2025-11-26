-- Alternative : Supprimer les exercices existants avant de réinsérer
-- ATTENTION : Cela supprimera TOUS les exercices du thème "Jeux enfant"

DELETE FROM pedagogy_sheets WHERE theme = 'Jeux enfant' AND sheet_type = 'educational_game';

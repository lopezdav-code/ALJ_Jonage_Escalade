-- PREREQUIS: Exécuter d'abord allow_null_url_pedagogy.sql pour autoriser les valeurs NULL dans url
--
-- Copier la valeur de url vers illustration_image pour les exercices d'échauffement
-- et vider la colonne url

UPDATE pedagogy_sheets
SET 
  illustration_image = url,
  url = NULL,
  updated_at = NOW()
WHERE 
  sheet_type = 'warm_up_exercise'
  AND url IS NOT NULL
  AND url != '';

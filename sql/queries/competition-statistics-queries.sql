-- Requêtes SQL pour les statistiques du module compétition
-- Date: 2025-11-17
-- Description: Statistiques complètes pour les compétiteurs (type_inscription = 'Compétition')

-- ====================================================================
-- 1. STATISTIQUES PAR SEXE
-- ====================================================================
SELECT
  COALESCE(sexe, 'Vide') AS sexe,
  CASE
    WHEN sexe = 'H' THEN 'Homme'
    WHEN sexe = 'F' THEN 'Femme'
    ELSE 'Vide'
  END AS sexe_label,
  COUNT(*) AS total_competiteurs,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM competition_registrations WHERE type_inscription = 'Compétition'), 2) AS pourcentage
FROM competition_registrations
WHERE type_inscription = 'Compétition'
GROUP BY sexe
ORDER BY
  CASE WHEN sexe = 'H' THEN 1 WHEN sexe = 'F' THEN 2 ELSE 3 END;

-- ====================================================================
-- 2. STATISTIQUES PAR CATÉGORIE D'ÂGE
-- ====================================================================
SELECT
  COALESCE(categorie_age, 'Vide') AS categorie_age,
  COUNT(*) AS total_competiteurs,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM competition_registrations WHERE type_inscription = 'Compétition'), 2) AS pourcentage
FROM competition_registrations
WHERE type_inscription = 'Compétition'
GROUP BY categorie_age
ORDER BY
  CASE
    WHEN categorie_age = 'U11' THEN 1
    WHEN categorie_age = 'U13' THEN 2
    WHEN categorie_age = 'U15' THEN 3
    WHEN categorie_age = 'U17' THEN 4
    WHEN categorie_age = 'U19' THEN 5
    WHEN categorie_age = 'Sénior' THEN 6
    WHEN categorie_age = 'Vétéran 1' THEN 7
    WHEN categorie_age = 'Vétéran 2' THEN 8
    ELSE 9
  END;

-- ====================================================================
-- 3. STATISTIQUES PAR HORAIRE (MATIN / APRÈS-MIDI)
-- ====================================================================
SELECT
  COALESCE(horaire, 'Vide') AS horaire,
  CASE
    WHEN horaire = 'matin' THEN 'Matin'
    WHEN horaire = 'après-midi' THEN 'Après-midi'
    ELSE 'Vide'
  END AS horaire_label,
  COUNT(*) AS total_competiteurs,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM competition_registrations WHERE type_inscription = 'Compétition'), 2) AS pourcentage
FROM competition_registrations
WHERE type_inscription = 'Compétition'
GROUP BY horaire
ORDER BY
  CASE WHEN horaire = 'matin' THEN 1 WHEN horaire = 'après-midi' THEN 2 ELSE 3 END;

-- ====================================================================
-- 4. STATISTIQUES COMBINÉES: SEXE + CATÉGORIE D'ÂGE
-- ====================================================================
SELECT
  CASE
    WHEN sexe = 'H' THEN 'Homme'
    WHEN sexe = 'F' THEN 'Femme'
    ELSE 'Vide'
  END AS sexe_label,
  COALESCE(categorie_age, 'Vide') AS categorie_age,
  COUNT(*) AS total_competiteurs
FROM competition_registrations
WHERE type_inscription = 'Compétition'
GROUP BY sexe, categorie_age
ORDER BY
  CASE WHEN sexe = 'H' THEN 1 WHEN sexe = 'F' THEN 2 ELSE 3 END,
  CASE
    WHEN categorie_age = 'U11' THEN 1
    WHEN categorie_age = 'U13' THEN 2
    WHEN categorie_age = 'U15' THEN 3
    WHEN categorie_age = 'U17' THEN 4
    WHEN categorie_age = 'U19' THEN 5
    WHEN categorie_age = 'Sénior' THEN 6
    WHEN categorie_age = 'Vétéran 1' THEN 7
    WHEN categorie_age = 'Vétéran 2' THEN 8
    ELSE 9
  END;

-- ====================================================================
-- 5. STATISTIQUES COMBINÉES: CATÉGORIE D'ÂGE + HORAIRE
-- ====================================================================
SELECT
  COALESCE(categorie_age, 'Vide') AS categorie_age,
  CASE
    WHEN horaire = 'matin' THEN 'Matin'
    WHEN horaire = 'après-midi' THEN 'Après-midi'
    ELSE 'Vide'
  END AS horaire_label,
  COUNT(*) AS total_competiteurs
FROM competition_registrations
WHERE type_inscription = 'Compétition'
GROUP BY categorie_age, horaire
ORDER BY
  CASE
    WHEN categorie_age = 'U11' THEN 1
    WHEN categorie_age = 'U13' THEN 2
    WHEN categorie_age = 'U15' THEN 3
    WHEN categorie_age = 'U17' THEN 4
    WHEN categorie_age = 'U19' THEN 5
    WHEN categorie_age = 'Sénior' THEN 6
    WHEN categorie_age = 'Vétéran 1' THEN 7
    WHEN categorie_age = 'Vétéran 2' THEN 8
    ELSE 9
  END,
  CASE WHEN horaire = 'matin' THEN 1 WHEN horaire = 'après-midi' THEN 2 ELSE 3 END;

-- ====================================================================
-- 6. STATISTIQUES COMBINÉES: SEXE + HORAIRE
-- ====================================================================
SELECT
  CASE
    WHEN sexe = 'H' THEN 'Homme'
    WHEN sexe = 'F' THEN 'Femme'
    ELSE 'Vide'
  END AS sexe_label,
  CASE
    WHEN horaire = 'matin' THEN 'Matin'
    WHEN horaire = 'après-midi' THEN 'Après-midi'
    ELSE 'Vide'
  END AS horaire_label,
  COUNT(*) AS total_competiteurs
FROM competition_registrations
WHERE type_inscription = 'Compétition'
GROUP BY sexe, horaire
ORDER BY
  CASE WHEN sexe = 'H' THEN 1 WHEN sexe = 'F' THEN 2 ELSE 3 END,
  CASE WHEN horaire = 'matin' THEN 1 WHEN horaire = 'après-midi' THEN 2 ELSE 3 END;

-- ====================================================================
-- 7. STATISTIQUES COMPLÈTES: SEXE + CATÉGORIE D'ÂGE + HORAIRE
-- ====================================================================
SELECT
  CASE
    WHEN sexe = 'H' THEN 'Homme'
    WHEN sexe = 'F' THEN 'Femme'
    ELSE 'Vide'
  END AS sexe_label,
  COALESCE(categorie_age, 'Vide') AS categorie_age,
  CASE
    WHEN horaire = 'matin' THEN 'Matin'
    WHEN horaire = 'après-midi' THEN 'Après-midi'
    ELSE 'Vide'
  END AS horaire_label,
  COUNT(*) AS total_competiteurs
FROM competition_registrations
WHERE type_inscription = 'Compétition'
GROUP BY sexe, categorie_age, horaire
ORDER BY
  CASE WHEN sexe = 'H' THEN 1 WHEN sexe = 'F' THEN 2 ELSE 3 END,
  CASE
    WHEN categorie_age = 'U11' THEN 1
    WHEN categorie_age = 'U13' THEN 2
    WHEN categorie_age = 'U15' THEN 3
    WHEN categorie_age = 'U17' THEN 4
    WHEN categorie_age = 'U19' THEN 5
    WHEN categorie_age = 'Sénior' THEN 6
    WHEN categorie_age = 'Vétéran 1' THEN 7
    WHEN categorie_age = 'Vétéran 2' THEN 8
    ELSE 9
  END,
  CASE WHEN horaire = 'matin' THEN 1 WHEN horaire = 'après-midi' THEN 2 ELSE 3 END;

-- ====================================================================
-- 8. RÉSUMÉ GLOBAL
-- ====================================================================
SELECT
  'Total compétiteurs' AS label,
  COUNT(*) AS total
FROM competition_registrations
WHERE type_inscription = 'Compétition'
UNION ALL
SELECT
  'Avec date de naissance' AS label,
  COUNT(*) AS total
FROM competition_registrations
WHERE type_inscription = 'Compétition' AND date_naissance IS NOT NULL
UNION ALL
SELECT
  'Hommes' AS label,
  COUNT(*) AS total
FROM competition_registrations
WHERE type_inscription = 'Compétition' AND sexe = 'H'
UNION ALL
SELECT
  'Femmes' AS label,
  COUNT(*) AS total
FROM competition_registrations
WHERE type_inscription = 'Compétition' AND sexe = 'F'
UNION ALL
SELECT
  'Horaire Matin' AS label,
  COUNT(*) AS total
FROM competition_registrations
WHERE type_inscription = 'Compétition' AND horaire = 'matin'
UNION ALL
SELECT
  'Horaire Après-midi' AS label,
  COUNT(*) AS total
FROM competition_registrations
WHERE type_inscription = 'Compétition' AND horaire = 'après-midi';

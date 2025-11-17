-- Test des vues créées - Script pour vérifier qu'il n'y a pas d'erreurs

-- Test 1: member_summary
-- SELECT * FROM member_summary LIMIT 1;

-- Test 2: session_detail
-- SELECT * FROM session_detail LIMIT 1;

-- Test 3: competition_summary
-- SELECT * FROM competition_summary LIMIT 1;

-- Test 4: attendance_summary (MATERIALIZED VIEW)
-- SELECT * FROM attendance_summary LIMIT 1;

-- Test 5: member_statistics (MATERIALIZED VIEW)
-- SELECT * FROM member_statistics LIMIT 1;

-- Test 6: pedagogy_sheet_usage (MATERIALIZED VIEW)
-- SELECT * FROM pedagogy_sheet_usage LIMIT 1;

-- Pour exécuter tous les tests, exécutez le script create-optimized-views.sql en premier
-- Puis décommentez les lignes ci-dessus

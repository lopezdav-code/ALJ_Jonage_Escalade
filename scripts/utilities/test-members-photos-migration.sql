-- ============================================
-- Script de Test Post-Migration
-- Vérification du système de photos membres avec RLS
-- ============================================

-- TEST 1 : Vérifier les URLs migrées
SELECT 
  id, 
  first_name, 
  last_name, 
  photo_url,
  CASE 
    WHEN photo_url LIKE '%supabase.co%' THEN '✅ Supabase'
    WHEN photo_url LIKE '/assets/%' THEN '⚠️ Local (à migrer)'
    WHEN photo_url IS NULL THEN '❌ Pas de photo'
    ELSE '❓ Autre'
  END as source_photo
FROM members
ORDER BY last_name, first_name;

-- TEST 2 : Statistiques photos
SELECT 
  COUNT(*) as total_membres,
  COUNT(photo_url) as membres_avec_photo,
  COUNT(CASE WHEN photo_url LIKE '%supabase.co%' THEN 1 END) as photos_supabase,
  COUNT(CASE WHEN photo_url LIKE '/assets/%' THEN 1 END) as photos_locales
FROM members;

-- TEST 3 : Vérifier les politiques RLS sur le bucket
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%membre%'
ORDER BY policyname;

-- TEST 4 : Liste des membres avec photos pour tests manuels
SELECT 
  id,
  first_name,
  last_name,
  photo_url
FROM members
WHERE photo_url IS NOT NULL
ORDER BY last_name
LIMIT 10;

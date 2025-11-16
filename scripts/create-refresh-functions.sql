-- ============================================================================
-- Fonctions RPC pour rafraîchir les vues matérialisées depuis JavaScript
-- À exécuter sur Supabase pour créer les points d'accès RPC
-- ============================================================================

-- ============================================================================
-- FONCTION 1 : Rafraîchir TOUTES les vues
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY member_statistics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY pedagogy_sheet_usage;

  result := json_build_object(
    'success', true,
    'message', 'Toutes les vues matérialisées rafraîchies',
    'views_refreshed', array['attendance_summary', 'member_statistics', 'pedagogy_sheet_usage'],
    'timestamp', NOW()
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'error', SQLERRM,
    'timestamp', NOW()
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION 2 : Rafraîchir une vue spécifique
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name text)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  CASE view_name
    WHEN 'attendance_summary' THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_summary;
      result := json_build_object(
        'success', true,
        'view', 'attendance_summary',
        'message', 'Vue attendance_summary rafraîchie',
        'timestamp', NOW()
      );

    WHEN 'member_statistics' THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY member_statistics;
      result := json_build_object(
        'success', true,
        'view', 'member_statistics',
        'message', 'Vue member_statistics rafraîchie',
        'timestamp', NOW()
      );

    WHEN 'pedagogy_sheet_usage' THEN
      REFRESH MATERIALIZED VIEW CONCURRENTLY pedagogy_sheet_usage;
      result := json_build_object(
        'success', true,
        'view', 'pedagogy_sheet_usage',
        'message', 'Vue pedagogy_sheet_usage rafraîchie',
        'timestamp', NOW()
      );

    ELSE
      result := json_build_object(
        'success', false,
        'error', 'Vue non reconnue : ' || view_name,
        'valid_views', array['attendance_summary', 'member_statistics', 'pedagogy_sheet_usage'],
        'timestamp', NOW()
      );
  END CASE;

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  result := json_build_object(
    'success', false,
    'view', view_name,
    'error', SQLERRM,
    'timestamp', NOW()
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FONCTION 3 : Statut du dernier rafraîchissement
-- ============================================================================

CREATE TABLE IF NOT EXISTS materialized_view_refresh_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  view_name text NOT NULL,
  refresh_status text NOT NULL, -- 'success' ou 'error'
  error_message text,
  refreshed_at timestamp NOT NULL DEFAULT NOW(),
  created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION get_last_refresh_status()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(
    json_build_object(
      'view_name', view_name,
      'status', refresh_status,
      'error', error_message,
      'refreshed_at', refreshed_at
    )
    ORDER BY refreshed_at DESC
  ) INTO result
  FROM (
    SELECT DISTINCT ON (view_name)
      view_name, refresh_status, error_message, refreshed_at
    FROM materialized_view_refresh_log
    ORDER BY view_name, refreshed_at DESC
  ) AS latest;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTORISER l'accès RPC aux utilisateurs authentifiés
-- ============================================================================

GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_materialized_view(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_last_refresh_status() TO authenticated;

-- ============================================================================
-- UTILISATION
-- ============================================================================

/*
Depuis JavaScript/React :

import { supabase } from '@/lib/customSupabaseClient';

// Rafraîchir toutes les vues
const { data, error } = await supabase.rpc('refresh_all_materialized_views');

// Rafraîchir une vue spécifique
const { data, error } = await supabase.rpc('refresh_materialized_view', {
  view_name: 'member_statistics'
});

// Vérifier le statut
const { data: status } = await supabase.rpc('get_last_refresh_status');
console.log(status);
*/

-- ============================================================================
-- CLEANUP (si vous n'en avez plus besoin)
-- ============================================================================

/*
DROP FUNCTION IF EXISTS refresh_all_materialized_views() CASCADE;
DROP FUNCTION IF EXISTS refresh_materialized_view(text) CASCADE;
DROP FUNCTION IF EXISTS get_last_refresh_status() CASCADE;
DROP TABLE IF EXISTS materialized_view_refresh_log CASCADE;
*/

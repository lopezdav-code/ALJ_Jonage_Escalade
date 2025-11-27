-- ============================================
-- Script de création du bucket members_photos avec politiques RLS
-- Club Escalade - Gestion sécurisée des photos membres
-- Date: 2025-10-12
-- ============================================

-- IMPORTANT : Ce script doit être exécuté dans le SQL Editor de Supabase
-- Il configure le bucket de stockage avec les politiques de sécurité

-- ============================================
-- 1. Création du bucket (si non existant)
-- ============================================
-- Le bucket doit être créé via l'interface Supabase Storage
-- Configuration recommandée :
--   - Nom: members_photos
--   - Public: NON (privé)
--   - File size limit: 5MB
--   - Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================
-- 2. Politique : Les adhérents peuvent voir les photos
-- ============================================
CREATE POLICY "Adhérents peuvent voir les photos membres"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'members_photos'
  AND (
    -- Vérifier que l'utilisateur a un profil avec un rôle adhérent ou supérieur
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('adherent', 'bureau', 'encadrant', 'admin')
    )
  )
);

-- ============================================
-- 3. Politique : Bureau+ peuvent uploader des photos
-- ============================================
CREATE POLICY "Bureau peuvent uploader des photos membres"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'members_photos'
  AND (
    -- Vérifier que l'utilisateur a un rôle bureau ou supérieur
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('bureau', 'encadrant', 'admin')
    )
  )
);

-- ============================================
-- 4. Politique : Bureau+ peuvent mettre à jour des photos
-- ============================================
CREATE POLICY "Bureau peuvent modifier des photos membres"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'members_photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('bureau', 'encadrant', 'admin')
    )
  )
)
WITH CHECK (
  bucket_id = 'members_photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('bureau', 'encadrant', 'admin')
    )
  )
);

-- ============================================
-- 5. Politique : Admin peuvent supprimer des photos
-- ============================================
CREATE POLICY "Admin peuvent supprimer des photos membres"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'members_photos'
  AND (
    -- Seuls les admins peuvent supprimer
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);

-- ============================================
-- RÉSUMÉ DES PERMISSIONS
-- ============================================
-- PUBLIC        : Aucun accès
-- USER          : Aucun accès
-- ADHÉRENT      : Voir les photos
-- BUREAU        : Voir + Uploader + Modifier
-- ENCADRANT     : Voir + Uploader + Modifier
-- ADMIN         : Voir + Uploader + Modifier + Supprimer
-- ============================================

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Après exécution, vérifier dans l'interface Supabase Storage :
-- 1. Le bucket 'members_photos' existe
-- 2. Il est configuré en PRIVÉ (non public)
-- 3. Les 4 politiques apparaissent dans l'onglet "Policies"

-- Test recommandé :
-- 1. Connectez-vous avec un compte adhérent → Doit voir les photos
-- 2. Essayez d'uploader → Doit échouer
-- 3. Connectez-vous avec un compte bureau → Doit uploader
-- 4. Essayez de supprimer → Doit échouer
-- 5. Connectez-vous avec admin → Doit supprimer
-- ============================================

# Guide de Migration des Images vers Supabase Storage

## 📋 Vue d'ensemble

Ce document explique comment migrer les photos des membres depuis le stockage local (`public/assets/members/`) vers Supabase Storage avec gestion des permissions par rôle.

---

## 🎯 Objectifs

1. **Centraliser** : Toutes les photos dans Supabase Storage
2. **Sécuriser** : Contrôle d'accès par RLS (Row Level Security)
3. **Optimiser** : Réduire la taille du repository Git
4. **Harmoniser** : Un seul système de stockage cohérent

---

## 🔧 Prérequis

### 1. Créer le bucket Supabase (si non existant)

Depuis l'interface Supabase (Storage) :
- **Nom** : `members_photos`
- **Public** : NON (privé)
- **File size limit** : 5 MB
- **Allowed MIME types** : `image/jpeg, image/png, image/webp`

### 2. Appliquer les politiques RLS

Exécutez le script SQL fourni :
```bash
# Ouvrir le SQL Editor dans Supabase
# Copier-coller le contenu de scripts/create-members-photos-bucket-policy.sql
# Exécuter
```

Vérifiez que les 4 politiques sont créées :
- ✅ Adhérents peuvent voir les photos
- ✅ Bureau peuvent uploader
- ✅ Bureau peuvent modifier
- ✅ Admin peuvent supprimer

---

## 📤 Migration Manuelle (Recommandée)

### Option 1 : Via l'interface Supabase

1. **Accéder au Storage** dans Supabase
2. **Ouvrir le bucket** `members_photos`
3. **Créer un dossier** `members_photos` (si non existant)
4. **Uploader les images** depuis `public/assets/members/`
   - Drag & drop de tous les fichiers
   - Attendre la fin de l'upload
5. **Vérifier** que toutes les images sont présentes

### Option 2 : Via script de migration automatique

Un script de migration sera créé prochainement pour automatiser l'upload en masse.

---

## 🗄️ Mise à jour de la base de données

Après la migration des fichiers, vous devez **mettre à jour les URLs** dans la table `members`.

### Script SQL de mise à jour

```sql
-- Mettre à jour les URLs des photos pour pointer vers Supabase Storage
-- IMPORTANT : Vérifier que les images sont bien uploadées avant d'exécuter

UPDATE members
SET photo_url = REPLACE(
  photo_url, 
  '/assets/members/', 
  'https://YOUR_SUPABASE_PROJECT.supabase.co/storage/v1/object/public/members_photos/members_photos/'
)
WHERE photo_url LIKE '/assets/members/%'
AND photo_url IS NOT NULL;

-- Remplacez YOUR_SUPABASE_PROJECT par votre ID de projet
-- Exemple : wixchrhuoyhlqfwmpqra.supabase.co
```

### Vérification après mise à jour

```sql
-- Vérifier les URLs migrées
SELECT id, first_name, last_name, photo_url
FROM members
WHERE photo_url IS NOT NULL
ORDER BY last_name;

-- Compter les membres avec photo
SELECT COUNT(*) as total_photos
FROM members
WHERE photo_url IS NOT NULL;
```

---

## 🧪 Tests Post-Migration

### 1. Test d'affichage

- Connectez-vous avec un compte **adhérent**
- Accédez à la page **Membres**
- Vérifiez que les photos s'affichent correctement
- Testez le fallback (initiales) pour les membres sans photo

### 2. Test d'upload

- Connectez-vous avec un compte **bureau** ou **admin**
- Éditez un membre
- Uploadez une nouvelle photo
- Vérifiez qu'elle apparaît immédiatement
- Vérifiez dans Supabase Storage qu'elle est bien créée

### 3. Test de permissions

**Compte Public (non connecté)** :
- ❌ Ne doit PAS voir les photos membres

**Compte User (connecté sans rôle)** :
- ❌ Ne doit PAS voir les photos membres

**Compte Adhérent** :
- ✅ Voir les photos
- ❌ Pas d'upload possible

**Compte Bureau** :
- ✅ Voir les photos
- ✅ Uploader de nouvelles photos
- ❌ Pas de suppression possible

**Compte Admin** :
- ✅ Voir, uploader, modifier, supprimer

---

## 🧹 Nettoyage Post-Migration

### 1. Vérifier que toutes les images sont migrées

```bash
# Lister les images locales restantes
ls public/assets/members/
```

### 2. Sauvegarder les images locales (optionnel)

```bash
# Créer une archive de sauvegarde
Compress-Archive -Path public/assets/members/* -DestinationPath backups/members_photos_backup_$(Get-Date -Format 'yyyy-MM-dd').zip
```

### 3. Supprimer les images locales de Git

```bash
# Les images sont maintenant dans .gitignore
# Supprimer du tracking Git (sans supprimer les fichiers locaux)
git rm --cached -r public/assets/members/
git rm --cached -r public/assets/passeports/

# Commit
git add .gitignore
git commit -m "chore: migration images vers Supabase Storage"
git push origin main
```

### 4. Supprimer les fichiers locaux (après vérification)

```powershell
# ATTENTION : Vérifier d'abord que tout fonctionne !
# Cette commande supprime définitivement les fichiers locaux
Remove-Item -Path public/assets/members/* -Recurse -Force
```

---

## 🔄 Rollback (En cas de problème)

Si vous rencontrez des problèmes, vous pouvez revenir en arrière :

### 1. Restaurer les URLs locales

```sql
-- Remettre les anciennes URLs locales
UPDATE members
SET photo_url = REPLACE(
  photo_url,
  'https://YOUR_SUPABASE_PROJECT.supabase.co/storage/v1/object/public/members_photos/members_photos/',
  '/assets/members/'
)
WHERE photo_url LIKE '%supabase.co%'
AND photo_url IS NOT NULL;
```

### 2. Restaurer les fichiers depuis backup

```powershell
# Extraire l'archive de sauvegarde
Expand-Archive -Path backups/members_photos_backup_*.zip -DestinationPath public/assets/members/
```

### 3. Réactiver le code legacy

Décommentez les fallbacks dans `memberImageUtils.js` si nécessaire.

---

## 📊 Résumé des Changements

| **Aspect**         | **Avant**                      | **Après**                        |
|--------------------|--------------------------------|----------------------------------|
| **Stockage**       | `public/assets/members/`       | Supabase Storage (bucket)        |
| **Sécurité**       | Aucune (public)                | RLS par rôle                     |
| **Versioning**     | Git (binaires lourds)          | Hors Git (ignoré)                |
| **Bucket**         | N/A                            | `members_photos`                 |
| **Upload**         | Code incohérent                | `uploadMemberPhoto()`            |
| **Affichage**      | Chemins locaux                 | `getMemberPhotoUrl()`            |
| **Permissions**    | Tous                           | Adhérent+ voir, Bureau+ uploader |

---

## ❓ FAQ

### Q : Pourquoi migrer vers Supabase Storage ?
**R** : Sécurité (RLS), scalabilité, et réduction de la taille du repo Git.

### Q : Les anciennes URLs locales fonctionnent-elles encore ?
**R** : Temporairement oui (compatibilité), mais elles afficheront un warning dans la console.

### Q : Que se passe-t-il si un membre n'a pas de photo ?
**R** : Le composant `SafeMemberAvatar` affiche automatiquement les initiales en fallback.

### Q : Comment gérer les photos de passeport ?
**R** : Un système similaire existe déjà (voir `src/pages/PasseportValidation.jsx`). Même logique à appliquer.

### Q : Puis-je télécharger toutes les photos en masse ?
**R** : Oui, via l'interface Supabase Storage (bouton "Download all").

---

## 📞 Support

En cas de problème lors de la migration :
1. Vérifiez les logs dans la console navigateur (F12)
2. Vérifiez les politiques RLS dans Supabase
3. Testez avec différents rôles (adhérent, bureau, admin)
4. Consultez `docs/image-management-system.md`

---

**Date de création** : 2025-10-12  
**Version** : 1.8.0  
**Auteur** : Système de gestion Club Escalade

# 🚀 Guide Migration Supabase - Étape par Étape

## ⏱️ Durée estimée : 15-20 minutes

---

## 📋 ÉTAPE 1 : Créer le Bucket Supabase (5 min)

### 1.1 Accéder à Supabase Storage

1. Ouvrir votre navigateur
2. Aller sur : **https://supabase.com/dashboard**
3. Se connecter à votre projet
4. Dans le menu latéral, cliquer sur **"Storage"**

### 1.2 Créer le bucket `members_photos`

1. Cliquer sur le bouton **"New bucket"** (ou "Create bucket")
2. Remplir les informations :
   - **Name** : `members_photos`
   - **Public bucket** : ❌ **NON** (décocher)
   - **File size limit** : `5242880` (5MB)
   - **Allowed MIME types** : `image/jpeg,image/jpg,image/png,image/webp`
3. Cliquer sur **"Create bucket"**

✅ **Vérification** : Le bucket `members_photos` apparaît dans la liste avec un cadenas 🔒 (privé)

---

## 🔐 ÉTAPE 2 : Appliquer les Politiques RLS (5 min)

### 2.1 Ouvrir le SQL Editor

1. Dans le menu latéral Supabase, cliquer sur **"SQL Editor"**
2. Cliquer sur **"New query"**

### 2.2 Copier-coller le script SQL

1. Ouvrir le fichier : `scripts/create-members-photos-bucket-policy.sql`
2. **Copier TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. **Coller dans le SQL Editor** de Supabase (Ctrl+V)

### 2.3 Exécuter le script

1. Cliquer sur le bouton **"Run"** (ou Ctrl+Entrée)
2. Attendre l'exécution (quelques secondes)
3. Vérifier qu'il y a **4 succès** :
   - ✅ Politique SELECT créée
   - ✅ Politique INSERT créée
   - ✅ Politique UPDATE créée
   - ✅ Politique DELETE créée

### 2.4 Vérifier les politiques

1. Retourner dans **"Storage"**
2. Cliquer sur le bucket **`members_photos`**
3. Cliquer sur l'onglet **"Policies"**
4. Vérifier que vous voyez **4 politiques** :
   - 🔍 Adhérents peuvent voir les photos membres
   - ➕ Bureau peuvent uploader des photos membres
   - ✏️ Bureau peuvent modifier des photos membres
   - 🗑️ Admin peuvent supprimer des photos membres

✅ **Vérification** : Les 4 politiques sont listées et actives

---

## 📤 ÉTAPE 3 : Migrer les Images Existantes (5 min)

### 3.1 Créer le dossier dans le bucket

1. Dans Supabase Storage, ouvrir le bucket **`members_photos`**
2. Cliquer sur **"Create folder"**
3. Nom du dossier : `members_photos`
4. Cliquer sur **"Create"**

### 3.2 Uploader les images locales

**Sur votre ordinateur** :

1. Ouvrir l'explorateur de fichiers Windows
2. Naviguer vers : `C:\Users\a138672\Downloads\club-escalade-app\public\assets\members\`
3. **Sélectionner toutes les images** (Ctrl+A)

**Dans Supabase** :

4. Cliquer sur le dossier **`members_photos`** que vous venez de créer
5. Cliquer sur **"Upload file"** (ou drag & drop)
6. Sélectionner les images depuis l'explorateur Windows
7. Attendre la fin de l'upload (barre de progression)

✅ **Vérification** : Toutes les images apparaissent dans Supabase Storage

**Image à migrer détectée** :
- `Clement_LIMA_FERREIRA.png` → À uploader

---

## 🗄️ ÉTAPE 4 : Mettre à Jour les URLs en Base de Données (3 min)

### 4.1 Récupérer l'URL de votre projet Supabase

1. Dans Supabase, aller dans **"Project Settings"** (icône engrenage)
2. Cliquer sur **"API"**
3. Copier l'**URL** qui ressemble à :
   ```
   https://VOTRE_PROJECT_ID.supabase.co
   ```
   Exemple : `https://wixchrhuoyhlqfwmpqra.supabase.co`

### 4.2 Préparer le script SQL de mise à jour

**Copier ce script et REMPLACER `YOUR_SUPABASE_PROJECT`** :

```sql
-- ATTENTION : Remplacer YOUR_SUPABASE_PROJECT par votre ID de projet !
-- Exemple : wixchrhuoyhlqfwmpqra

-- Mettre à jour les URLs des photos pour pointer vers Supabase Storage
UPDATE members
SET photo_url = REPLACE(
  photo_url, 
  '/assets/members/', 
  'https://YOUR_SUPABASE_PROJECT.supabase.co/storage/v1/object/public/members_photos/members_photos/'
)
WHERE photo_url LIKE '/assets/members/%'
AND photo_url IS NOT NULL;

-- Vérifier les URLs migrées
SELECT id, first_name, last_name, photo_url
FROM members
WHERE photo_url IS NOT NULL
ORDER BY last_name;
```

### 4.3 Exécuter le script

1. Ouvrir le **SQL Editor** dans Supabase
2. **Coller le script modifié** (avec VOTRE URL)
3. Cliquer sur **"Run"**
4. Vérifier le nombre de lignes mises à jour

✅ **Vérification** : Les URLs commencent maintenant par `https://...supabase.co/storage/...`

---

## 🧪 ÉTAPE 5 : Tester le Système (2 min)

### 5.1 Test avec compte Adhérent

1. Déconnectez-vous de votre application
2. Connectez-vous avec un **compte adhérent**
3. Aller sur la page **"Membres"**
4. **Vérifier** : Les photos s'affichent correctement ✅
5. **Vérifier** : Pas de bouton "Modifier" visible ✅

### 5.2 Test avec compte Bureau

1. Déconnectez-vous
2. Connectez-vous avec un **compte bureau**
3. Aller sur la page **"Membres"**
4. **Cliquer sur "Modifier"** un membre
5. **Uploader une nouvelle photo**
6. **Vérifier** : La photo apparaît immédiatement ✅
7. **Vérifier dans Supabase Storage** : L'image est bien créée ✅

### 5.3 Test avec compte Public (non connecté)

1. Déconnectez-vous complètement
2. Aller sur la page **"Membres"** (si accessible publiquement)
3. **Vérifier** : Les avatars affichent les **initiales** (fallback) ✅
4. **Vérifier** : Aucune photo ne se charge (RLS bloque) ✅

---

## 🧹 ÉTAPE 6 : Nettoyage (Optionnel)

### 6.1 Sauvegarder les images locales

```powershell
# Créer une archive de sauvegarde
Compress-Archive -Path C:\Users\a138672\Downloads\club-escalade-app\public\assets\members\* -DestinationPath C:\Users\a138672\Downloads\club-escalade-app\backups\members_photos_backup_2025-10-12.zip
```

### 6.2 Supprimer du tracking Git

```powershell
# Les images sont maintenant dans .gitignore
cd C:\Users\a138672\Downloads\club-escalade-app

# Supprimer du tracking Git (sans supprimer les fichiers locaux)
git rm --cached -r public/assets/members/
git rm --cached -r public/assets/passeports/

# Commit
git add .gitignore
git commit -m "chore: suppression images du tracking Git après migration Supabase"
git push origin main
```

### 6.3 Supprimer les fichiers locaux (APRÈS vérification)

⚠️ **ATTENTION** : Ne faire qu'après avoir vérifié que tout fonctionne !

```powershell
# Supprimer définitivement les fichiers locaux
Remove-Item -Path C:\Users\a138672\Downloads\club-escalade-app\public\assets\members\* -Recurse -Force
```

---

## ✅ Checklist Finale

Cochez au fur et à mesure :

- [ ] Bucket `members_photos` créé (privé)
- [ ] 4 politiques RLS appliquées
- [ ] Images uploadées dans Supabase Storage
- [ ] URLs mises à jour en base de données
- [ ] Test adhérent : Photos visibles ✅
- [ ] Test bureau : Upload fonctionne ✅
- [ ] Test public : Photos bloquées ✅
- [ ] Backup images locales créé
- [ ] Images retirées du tracking Git
- [ ] Fichiers locaux supprimés (optionnel)

---

## 🆘 Dépannage

### Problème : Les photos ne s'affichent pas

**Solution** :
1. Vérifier que le bucket est bien **privé** (pas public)
2. Vérifier que les 4 politiques RLS sont actives
3. Ouvrir la console navigateur (F12) → Regarder les erreurs
4. Vérifier que l'utilisateur est **connecté** avec un rôle **adhérent+**

### Problème : Erreur "Bucket not found"

**Solution** :
1. Vérifier le nom du bucket : **exactement** `members_photos` (avec underscore)
2. Vérifier que le bucket existe dans Supabase Storage
3. Recharger la page

### Problème : "Access denied" lors de l'upload

**Solution** :
1. Vérifier que l'utilisateur a le rôle **bureau** ou **admin**
2. Vérifier que la politique INSERT est bien créée
3. Tester avec un compte admin pour isoler le problème

---

## 📞 Support

En cas de blocage :
1. Vérifier les logs dans la console (F12)
2. Vérifier les politiques dans Supabase Storage → Policies
3. Consulter `docs/migration-images-supabase.md` (documentation complète)

---

**Date** : 2025-10-12  
**Version** : 1.8.0  
**Durée totale** : ~15-20 minutes

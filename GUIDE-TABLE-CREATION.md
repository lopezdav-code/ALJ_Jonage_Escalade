# 🛠️ Guide de création de la table vocabulary_sheets

## ❌ Problème détecté
La table `vocabulary_sheets` n'existe pas dans votre base de données Supabase.

## ✅ Solution rapide

### Étape 1: Aller dans Supabase
1. Ouvrez votre dashboard Supabase
2. Allez dans **SQL Editor** (dans la barre latérale)

### Étape 2: Exécuter le script SQL
1. Cliquez sur **"New query"**
2. Copiez-collez le contenu du fichier : `scripts/create-vocabulary-table-supabase.sql`
3. Cliquez sur **"Run"** (ou Ctrl+Enter)

### Étape 3: Vérifier la création
La table devrait apparaître dans **Table Editor** avec ces colonnes :
- `id` (bigserial, PRIMARY KEY)
- `pedagogy_sheet_id` (bigint, FOREIGN KEY)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## 🧪 Test de la fonctionnalité
1. Redémarrez l'application : `npm run dev`
2. Allez sur la page Vocabulaire
3. Cliquez sur "Ajouter une fiche"
4. Sélectionnez une fiche → Elle devrait se sauvegarder automatiquement

## 🆘 En cas de problème
- Vérifiez que vous avez les permissions d'administration sur Supabase
- La table `pedagogy_sheets` doit exister (✅ confirmé)
- Contactez-nous si l'erreur persiste

## 📝 Script SQL complet
Le script `scripts/create-vocabulary-table-supabase.sql` contient :
- Création de la table
- Configuration RLS (Row Level Security)
- Index pour les performances
- Trigger pour `updated_at`
- Commentaires de documentation
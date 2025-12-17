# 🚀 FFME Scraper - Guide de déploiement complet

## Phase 1: Configuration des variables d'environnement (LOCAL)

### Étape 1.1: Créer/Mettre à jour `.env.local`

À la racine du projet (`c:\Users\a138672\Downloads\club-escalade-app\.env.local`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Où trouver ces valeurs:**
1. https://app.supabase.com
2. Sélectionnez votre projet
3. Settings → API
4. Copiez: **Project URL** et **anon public key**

### Étape 1.2: Redémarrer le serveur de développement

```bash
# Arrêter le serveur courant (Ctrl+C)
# Puis redémarrer:
npm run dev
```

---

## Phase 2: Déployer l'Edge Function

### Étape 2.1: Authenticator avec Supabase CLI

```bash
supabase login
```

Cela ouvrira votre navigateur pour se connecter à Supabase.

### Étape 2.2: Déployer l'Edge Function

```bash
supabase functions deploy scrape-ffme-competition
```

Vous devriez voir:

```
✓ Function deployed successfully
  URI: https://your-project.supabase.co/functions/v1/scrape-ffme-competition
```

### Étape 2.3: Vérifier le déploiement (optionnel)

Allez sur: https://app.supabase.com → Edge Functions → `scrape-ffme-competition`

---

## Phase 3: Déployer la migration de base de données

### Étape 3.1: Obtenir les identifiants Supabase

1. https://app.supabase.com
2. Sélectionnez votre projet
3. Settings → Database
4. Notez: **Host**, **Username**, **Password**

### Étape 3.2: Exécuter la migration

**Option A: Via Supabase Dashboard (facile)**

1. Allez sur: https://app.supabase.com → SQL Editor
2. Cliquez: **New Query**
3. Copiez le contenu de: `migrations/20251217_create_ffme_competitions_index.sql`
4. Collez dans l'éditeur
5. Cliquez: **Run**

**Option B: Via CLI**

```bash
supabase db push
```

### Étape 3.3: Vérifier la table

Allez sur: https://app.supabase.com → Table Editor

Vous devriez voir: `ffme_competitions_index`

---

## Phase 4: Tester le scraper

### Étape 4.1: Ouvrir la page Competitions

1. Allez sur: http://localhost:3000/ALJ_Jonage_Escalade/competitions
2. Cherchez l'onglet: **"Scraper FFME"**

### Étape 4.2: Lancer un test

1. **Start ID:** `13150`
2. **End ID:** `13160` (juste 10 pour tester)
3. Cliquez: **Démarrer le scraper**

### Étape 4.3: Vérifier les résultats

Vous devrais voir:

- ✅ Barre de progression
- ✅ Compteur de réussis/erreurs
- ✅ Données apparaître dans `ffme_competitions_index` table (Supabase Dashboard)

---

## 🔧 Dépannage

### ❌ "process is not defined"

**Cause:** Serveur de développement n'a pas rechargé les variables d'environnement

**Solution:**
```bash
# Arrêter (Ctrl+C)
npm run dev
```

---

### ❌ "Edge Function returns 404"

**Cause:** L'Edge Function n'a pas été déployée

**Solution:**
```bash
supabase functions deploy scrape-ffme-competition
```

---

### ❌ "Table does not exist"

**Cause:** La migration SQL n'a pas été exécutée

**Solution:** 
Allez sur Supabase Dashboard → SQL Editor et exécutez: `migrations/20251217_create_ffme_competitions_index.sql`

---

### ❌ "CORS error" ou "No 'Access-Control-Allow-Origin'"

**Cause:** L'Edge Function n'a pas les headers CORS

**Solution:** L'Edge Function (`supabase/functions/scrape-ffme-competition/index.ts`) déjà contient les headers CORS. Vérifiez que vous l'avez déployée avec `supabase functions deploy`.

---

## ✅ Checklist finale

- [ ] `.env.local` configuré avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- [ ] Serveur de développement redémarré (`npm run dev`)
- [ ] `supabase login` exécuté
- [ ] `supabase functions deploy scrape-ffme-competition` exécuté
- [ ] Migration SQL exécutée (table `ffme_competitions_index` créée)
- [ ] Scraper testé avec 10 IDs (ex: 13150-13160)
- [ ] Données visibles dans Supabase Dashboard → Table Editor → `ffme_competitions_index`

---

## 📞 Support

Si vous rencontrez des problèmes:

1. Vérifiez les logs du navigateur (F12 → Console)
2. Vérifiez les logs du serveur (`npm run dev`)
3. Vérifiez les logs de l'Edge Function: Supabase Dashboard → Edge Functions → Logs
4. Vérifiez les RLS policies: Settings → Database → Users Management → RLS


# 🔧 Configuration Supabase Edge Function - FFME Scraper

## ⚠️ IMPORTANT: Déploiement requis

Le scraper FFME utilise une **Supabase Edge Function** pour contourner les problèmes CORS.

## 📋 Étapes de configuration

### 1. Installer Supabase CLI (une fois)

```bash
npm install -g supabase
```

Ou sur macOS avec Homebrew:
```bash
brew install supabase/tap/supabase
```

### 2. Configurer les credentials Supabase

```bash
supabase login
```

Suivez les instructions pour vous authentifier.

### 3. Déployer l'Edge Function

```bash
# Déployer la function de scraping FFME
supabase functions deploy scrape-ffme-competition
```

Vous devriez voir:
```
✅ Function deployed successfully
  Endpoint: https://your-project.functions.supabase.co/scrape-ffme-competition
```

### 4. Vérifier le déploiement

1. Allez sur: https://app.supabase.com
2. Sélectionnez votre projet
3. Allez à: **Edge Functions** (menu de gauche)
4. Vous devriez voir: **scrape-ffme-competition**

## 🧪 Tester la function

### Via Supabase Dashboard

1. Ouvrez la function **scrape-ffme-competition**
2. Cliquez sur **Test**
3. Entrez l'ID: `13150`
4. Cliquez **Send request**

Vous devriez voir une réponse JSON avec le titre.

### Via curl

```bash
curl -X GET "https://your-project.functions.supabase.co/scrape-ffme-competition?id=13150" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

(Remplacez `YOUR_ANON_KEY` par votre clé anon Supabase)

### Via JavaScript

```javascript
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const response = await fetch(
  `${supabaseUrl}/functions/v1/scrape-ffme-competition?id=13150`
);
const data = await response.json();
console.log(data);
```

## 📝 Structure de la réponse

### Succès (200)
```json
{
  "success": true,
  "ffme_id": 13150,
  "title": "Competition Title Here"
}
```

### Erreur (400/500)
```json
{
  "error": "No title found",
  "status": 400
}
```

## 🔍 Architecture

```
Navigateur (FFMECompetitionScraper.jsx)
    ↓
useFFMECompetitionScraper Hook
    ↓
Supabase Edge Function (scrape-ffme-competition)
    ↓
mycompet.ffme.fr (pas de CORS!)
    ↓
Extrait le titre
    ↓
Retourne JSON
    ↓
Sauvegarde en BDD
```

## ✅ Vérification finale

Une fois l'Edge Function déployée:

1. ✅ Le scraper devrait fonctionner sans erreurs CORS
2. ✅ Les données s'inscrivent correctement en BDD
3. ✅ Vous pouvez tester via Supabase Dashboard

## 🚀 Utiliser maintenant

```bash
# 1. Vérifier que la function est déployée
supabase functions list

# 2. Aller sur Compétitions → "Scraper FFME"
# 3. Tester avec 13150-13160
# 4. Vérifier les résultats en Supabase!
```

## ⚙️ Configuration dans .env

```env
# Ces variables doivent être définies:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 🐛 Dépannage

### "Function not found"
- Vérifier que `supabase functions deploy scrape-ffme-competition` a réussi
- Vérifier qu'elle apparaît dans Supabase Dashboard → Edge Functions

### "401 Unauthorized"
- Vérifier que VITE_SUPABASE_ANON_KEY est correct
- La function est publique, pas besoin d'auth

### "No title found"
- L'ID n'existe pas ou la structure HTML a changé
- Vérifier manuellement: https://mycompet.ffme.fr/resultat/resultat_{ID}

### "Connection timeout"
- Le site FFME peut être down
- Essayer un autre ID

## 📚 Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [CORS dans Edge Functions](https://supabase.com/docs/guides/functions/cors)

## 💡 Notes

- La function est **déployée globalement** (pas besoin de redéployer)
- Elle s'exécute **côté serveur** (pas de CORS)
- Les appels sont **rapides** (~200ms)
- Les logs sont visibles dans **Supabase Dashboard**

---

**Status**: ✅ Configuration facile et rapide

Après le déploiement, le scraper fonctionne parfaitement! 🎉

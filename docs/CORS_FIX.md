# 🔒 CORS Error Fix - FFME Scraper

## ❌ Erreur reçue

```
Access to fetch at 'https://mycompet.ffme.fr/resultat/resultat_13150' from origin 
'http://localhost:3002' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' 
header is present on the requested resource.
```

## ✅ Solution

Le site FFME n'autorise pas les requêtes directes depuis le navigateur. La solution est d'utiliser une **Supabase Edge Function** qui fait le fetch côté serveur.

### Étapes rapides

**1. Déployer la Edge Function (2 min)**

```bash
# Installer Supabase CLI si ce n'est pas fait
npm install -g supabase

# Se connecter
supabase login

# Déployer la function
supabase functions deploy scrape-ffme-competition
```

**2. Attendre la confirmation**

```
✅ Function deployed successfully
  Endpoint: https://your-project.functions.supabase.co/scrape-ffme-competition
```

**3. Tester**

- Aller sur: Compétitions → "Scraper FFME"
- Cliquer: "Démarrer le scraping"
- ✅ Ça devrait marcher maintenant!

## 🔄 Comment ça fonctionne

**Avant** (❌ CORS error):
```
Navigateur → mycompet.ffme.fr ❌ Bloqué par CORS
```

**Après** (✅ Fonctionne):
```
Navigateur → Supabase Edge Function → mycompet.ffme.fr ✅ OK
```

L'Edge Function fait le fetch côté serveur, pas de problème CORS!

## 🧪 Vérifier que ça fonctionne

```bash
# Voir la list des functions
supabase functions list

# Vous devriez voir:
# ✓ scrape-ffme-competition
```

## 📚 Documentation complète

Voir: [docs/FFME_EDGE_FUNCTION_SETUP.md](./FFME_EDGE_FUNCTION_SETUP.md)

## 💡 Questions fréquentes

**Q: Je suis sur Netlify/Vercel, pas Supabase local?**  
A: La Edge Function est automatiquement déployée sur le serveur Supabase (cloud). Pas besoin de faire autre chose.

**Q: Ça coûte quelque chose?**  
A: Supabase offre 500k invocations gratuites par mois. Le scraper en utilise très peu.

**Q: Ça va rester déployé?**  
A: Oui, une fois déployée, la function reste active jusqu'à la suppression manuelle.

**Q: Combien de temps ça prend?**  
A: Environ 2-3 minutes pour le déploiement initial. Les appels prennent ~200ms.

## ✅ Ça devrait marcher maintenant!

Testez et dites-moi si vous avez d'autres erreurs! 🚀

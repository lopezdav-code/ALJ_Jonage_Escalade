# 🎯 FFME Competition Scraper - Implémentation Complète

## 📝 Résumé

J'ai créé un système complet de scraping pour indexer les compétitions FFME depuis mycompet.ffme.fr.

### ✨ Fonctionnalités

✅ **Interface web** - Onglet dédié sur la page Compétitions  
✅ **Script Node.js** - CLI pour scraping automatisé  
✅ **Service API** - Requêtes de données indexées  
✅ **Hook personnalisé** - Logique réutilisable  
✅ **Base de données** - Table avec RLS et indexes full-text  
✅ **Documentation** - Guide complet pour les utilisateurs  

## 📁 Fichiers Créés

### 🗄️ Base de données
- **`migrations/20251217_create_ffme_competitions_index.sql`**
  - Table: `ffme_competitions_index`
  - Colonnes: id, ffme_id, title, created_at, updated_at
  - Index full-text search en français
  - RLS pour sécurité

### 🚀 Scripts
- **`scripts/scrape-ffme-competitions.js`**
  - CLI Node.js avec cheerio
  - Arguments: `node scripts/scrape-ffme-competitions.js 13150 13200`
  - Logs détaillés
  - Délai respectueux (1s entre requêtes)

- **`scripts/test-ffme-scraper.js`**
  - Données de test et exemples
  - Instructions de vérification

### 🎨 Frontend
- **`src/components/competitions/FFMECompetitionScraper.jsx`**
  - Composant React avec interface utilisateur
  - Formulaire d'entrée (ID début/fin)
  - Barre de progression en temps réel
  - Affichage des résultats et erreurs
  - Bouton réinitialiser

### 🔧 Services & Hooks
- **`src/services/ffmeCompetitionsService.js`**
  - `getFFMECompetitions()` - Récupérer toutes
  - `searchFFMECompetitions(query)` - Chercher par titre ou ID
  - `getFFMECompetition(id)` - Récupérer par ID unique
  - `getFFMECompetitionUrl(id)` - URL du resultat
  - `linkFFMECompetition()` - Lier à une compétition du club

- **`src/hooks/useFFMECompetitionScraper.js`**
  - Hook personnalisé pour logique de scraping
  - État: loading, progress, results
  - Gestion des erreurs
  - Respectueux du serveur FFME

### 📚 Documentation
- **`docs/ffme-scraper-guide.md`**
  - Guide complet d'utilisation
  - Architecture et fonctionnement
  - API service
  - Dépannage
  - Exemples de code

### 📝 Fichiers Modifiés
- **`src/pages/Competitions.jsx`**
  - Import du composant FFMECompetitionScraper
  - Nouvel onglet "Scraper FFME" (4e onglet)

- **`CLAUDE.md`**
  - Documention du nouveau système
  - Ajout au guide architecture

## 🎮 Utilisation

### Via l'interface web

1. Allez sur: **Compétitions → Scraper FFME**
2. Entrez les IDs (ex: 13150 - 13160)
3. Cliquez "Démarrer le scraping"
4. Attendez la progression
5. Vérifiez les résultats

### Via le script CLI

```bash
# Plage par défaut (13150-13160)
node scripts/scrape-ffme-competitions.js

# Plage personnalisée
node scripts/scrape-ffme-competitions.js 13100 13200
```

### Via le service

```javascript
import { searchFFMECompetitions, getFFMECompetition } from '@/services/ffmeCompetitionsService';

// Chercher une compétition
const results = await searchFFMECompetitions('13150');

// Récupérer une compétition spécifique
const comp = await getFFMECompetition(13150);
```

## 🔄 Flux de données

```
Interface utilisateur
        ↓
useFFMECompetitionScraper hook
        ↓
Fetch HTML de mycompet.ffme.fr
        ↓
Extraire title de <div class="title">
        ↓
Upsert dans ffme_competitions_index
        ↓
Afficher résultats à l'utilisateur
```

## 🛡️ Sécurité

✅ **RLS activé** - Contrôle d'accès au niveau DB  
✅ **IDs uniques** - Pas de duplication  
✅ **Délais respectueux** - 800ms GUI / 1s CLI  
✅ **Arrêt à la première erreur** - Évite surcharge  
✅ **User-Agent** - Respectueux du serveur FFME  

## 🧪 Test

```bash
# Voir les données de test
node scripts/test-ffme-scraper.js
```

## 📊 Résultats attendus

Après scraping de 13150-13160 avec succès:

```
✅ Sauvegardées: 10
❌ Erreurs: 0
💾 Base de données: 10 lignes dans ffme_competitions_index
```

En cas d'erreur:

```
✅ Sauvegardées: 3
❌ Erreurs: 1
⛔ Arrêt à: ID 13153
📝 Raison: HTTP 404 Error ou No title found (invalid page)
```

## 🔧 Configuration

### Délais
- **GUI**: 800ms entre les requêtes
- **CLI**: 1s entre les requêtes

### ID par défaut
- **Début**: 13150
- **Fin**: 13160

### Limite de recherche
- Maximum 10 résultats par recherche

## 📈 Performance

- **Extraction titre**: Regex (fast)
- **Recherche**: Index full-text français
- **Lectures**: Authentifiées (cached)
- **Écritures**: Service role (rapide)

## 🐛 Dépannage

### "Pas de titre trouvé"
- La structure HTML du site FFME a peut-être changé
- Vérifiez manuellement: https://mycompet.ffme.fr/resultat/resultat_13150

### "HTTP 404"
- L'ID n'existe pas sur le site FFME
- Essayez un autre intervalle

### "Erreur base de données"
- Vérifiez que la migration a été exécutée
- Vérifiez les permissions Supabase

## ✅ Checklist de vérification

- [ ] Migration exécutée (table créée)
- [ ] Composant affiché sur la page Compétitions
- [ ] Scraping lancé avec succes (13150-13160)
- [ ] Données visibles dans la table `ffme_competitions_index`
- [ ] Service API fonctionne (searchFFMECompetitions)
- [ ] Hook personnalisé réutilisable

## 📞 Support

Consultez [docs/ffme-scraper-guide.md](../docs/ffme-scraper-guide.md) pour:
- Guide complet d'utilisation
- Architecture détaillée
- Bonnes pratiques
- Dépannage avancé
- Exemples de code

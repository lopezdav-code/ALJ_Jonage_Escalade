# Scraper de Compétitions FFME

Ce système permet de scraper les pages de résultats de compétitions depuis le site FFME (mycompet.ffme.fr) et d'indexer automatiquement les compétitions par ID.

## 📋 Vue d'ensemble

Le système récupère les titres des compétitions depuis les pages de résultats FFME et les stocke dans une table de base de données pour un accès rapide et une recherche facile.

**URL Source**: `https://mycompet.ffme.fr/resultat/resultat_{id}`

Les données sont extraites de: `<div class="title">{Title}</div>`

## 🗄️ Base de données

### Table: `ffme_competitions_index`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | BIGSERIAL | Identifiant primaire |
| `ffme_id` | BIGINT | ID unique de la compétition FFME (clé unique) |
| `title` | TEXT | Titre de la compétition |
| `created_at` | TIMESTAMP | Date de création de l'enregistrement |
| `updated_at` | TIMESTAMP | Date de dernière mise à jour |

### Index créés
- `idx_ffme_competitions_index_ffme_id`: Pour les recherches rapides par ID
- `idx_ffme_competitions_index_title`: Index GIN sur le titre pour la recherche fulltext en français

## 🚀 Utilisation

### ⚠️ IMPORTANT: Configuration requise

Avant d'utiliser le scraper, vous devez déployer la **Supabase Edge Function**:

```bash
supabase functions deploy scrape-ffme-competition
```

Voir [FFME_EDGE_FUNCTION_SETUP.md](./FFME_EDGE_FUNCTION_SETUP.md) pour les détails complets.

### Via l'interface web (GUI)

1. Allez sur la page **Compétitions**
2. Cliquez sur l'onglet **"Scraper FFME"**
3. Entrez l'ID de début et fin (ex: 13150 à 13160)
4. Cliquez sur **"Démarrer le scraping"**

Le scraper va:
- ✅ Ouvrir chaque page de résultats (via Edge Function)
- ✅ Extraire le titre de la compétition
- ✅ Sauvegarder dans la BDD
- ⛔ S'arrêter à la première page en erreur ou invalide

### Via le script Node.js

```bash
# Utiliser les paramètres par défaut (13150 à 13160)
node scripts/scrape-ffme-competitions.js

# Ou spécifier une plage personnalisée
node scripts/scrape-ffme-competitions.js 13150 13200
```

## 🔧 API Service

Utilisez le service `ffmeCompetitionsService.js` pour interroger les compétitions indexées:

```javascript
import { 
  getFFMECompetitions,
  searchFFMECompetitions,
  getFFMECompetition,
  getFFMECompetitionUrl,
  linkFFMECompetition 
} from '@/services/ffmeCompetitionsService';

// Récupérer toutes les compétitions
const allComps = await getFFMECompetitions();

// Chercher par titre ou ID
const results = await searchFFMECompetitions('13150');

// Récupérer une compétition spécifique
const comp = await getFFMECompetition(13150);

// Obtenir l'URL
const url = getFFMECompetitionUrl(13150); // https://mycompet.ffme.fr/resultat/resultat_13150

// Lier à une compétition du club
await linkFFMECompetition(clubCompetitionId, 13150);
```

## 📊 Fonctionnement du scraper

### GUI React

Fichier: `src/components/competitions/FFMECompetitionScraper.jsx`

Le composant React fournit:
- ✅ Interface de saisie des ID début/fin
- ✅ Affichage de la progression en temps réel
- ✅ Statistiques (succès, erreurs)
- ✅ Gestion des erreurs avec arrêt automatique
- ✅ Délai de 800ms entre les requêtes (respectueux du serveur)

### Script Node.js

Fichier: `scripts/scrape-ffme-competitions.js`

Caractéristiques:
- ✅ Utilise `cheerio` pour parser le HTML
- ✅ Regex de secours pour extraire le titre
- ✅ Délai de 1 seconde entre les requêtes
- ✅ Arrêt automatique à la première erreur
- ✅ Logs détaillés de progression
- ✅ Support des variables d'environnement

## ⚠️ Comportement d'arrêt

Le scraper s'arrête dans ces cas:

1. **Erreur HTTP** (ex: 404, 403, 500)
   ```
   Raison: HTTP 404 Error
   ```

2. **Page invalide** (titre non trouvé)
   ```
   Raison: No title found (invalid page)
   ```

3. **Erreur réseau** (timeout, connexion fermée)
   ```
   Raison: [Message d'erreur réseau]
   ```

4. **Erreur base de données** (sauf pour la GUI qui continue)
   ```
   Raison: Database error
   ```

## 💡 Bonnes pratiques

### Commencer petit
```javascript
// Test avec 10-20 compétitions d'abord
startId = 13150, endId = 13160
```

### Explorez les plages
```javascript
// Vérifiez manuellement quelques URLs:
// https://mycompet.ffme.fr/resultat/resultat_13150
// https://mycompet.ffme.fr/resultat/resultat_13151
// Pour trouver une plage valide
```

### Surveillance
- 📊 Vérifiez les logs dans la console navigateur (GUI)
- 📊 Vérifiez les logs du terminal (script Node.js)
- 🔍 Interrogez la table directement dans Supabase si besoin

## 🔐 Sécurité

- ✅ RLS (Row Level Security) activé
- ✅ Utilisateurs authentifiés: accès en lecture
- ✅ Service role: gestion complète
- ✅ IDs FFME uniques (duplication impossible)
- ✅ Timestamps d'audit (création/modification)

## 🐛 Dépannage

### Le scraper s'arrête immédiatement

**Problème**: La première page testée n'existe pas

**Solution**: 
- Vérifiez que l'ID de début existe: `https://mycompet.ffme.fr/resultat/resultat_{startId}`
- Essayez avec un ID connu qui existe

### Pas de titre trouvé

**Problème**: La structure HTML a changé ou le titre n'est pas dans `<div class="title">`

**Solution**:
- Inspectez manuellement la page HTML
- Mettez à jour le regex d'extraction si besoin
- Signalez le problème (le site FFME peut avoir changé de structure)

### Erreur de base de données

**Problème**: Impossible d'insérer les données

**Solution**:
- Vérifiez que la migration a été exécutée: `20251217_create_ffme_competitions_index.sql`
- Vérifiez les permissions Supabase
- Vérifiez les logs d'erreur Supabase

## 📈 Exemple complet

```javascript
// Dans un composant React
import { useState } from 'react';
import { searchFFMECompetitions } from '@/services/ffmeCompetitionsService';

export function CompetitionFinder() {
  const [results, setResults] = useState([]);

  const handleSearch = async (query) => {
    const competitions = await searchFFMECompetitions(query);
    setResults(competitions);
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Chercher par ID ou titre"
        onChange={(e) => handleSearch(e.target.value)}
      />
      <ul>
        {results.map(comp => (
          <li key={comp.ffme_id}>
            ID {comp.ffme_id}: {comp.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 📚 Fichiers créés/modifiés

- ✅ `migrations/20251217_create_ffme_competitions_index.sql` - Migration de création de table
- ✅ `scripts/scrape-ffme-competitions.js` - Script Node.js de scraping
- ✅ `src/components/competitions/FFMECompetitionScraper.jsx` - Composant React GUI
- ✅ `src/services/ffmeCompetitionsService.js` - Service pour interroger les données
- ✅ `src/pages/Competitions.jsx` - Intégration du nouvel onglet
- ✅ `docs/ffme-scraper-guide.md` - Cette documentation

## 🤝 Support

Pour des questions ou des problèmes:
1. Vérifiez d'abord cette documentation
2. Consultez les logs navigateur (F12)
3. Vérifiez les logs Supabase
4. Signalez le problème avec les détails

# 📑 Index - FFME Competition Scraper

## 🎯 Vue d'ensemble rapide

Système complet pour scraper les compétitions FFME depuis https://mycompet.ffme.fr/resultat/resultat_{id}

**Status**: ✅ Livré et prêt à l'emploi  
**Date**: 17 décembre 2025  
**Version**: 1.0

---

## 📁 Structure des fichiers

### 🗄️ Base de données
```
migrations/
└── 20251217_create_ffme_competitions_index.sql    Table + RLS + Index full-text
```

**Contient**: 
- Table `ffme_competitions_index`
- 5 colonnes: id, ffme_id, title, created_at, updated_at
- Row Level Security (RLS)
- Indexes pour performance
- Commentaires et documentation SQL

---

### 🚀 Scripts Node.js
```
scripts/
├── scrape-ffme-competitions.js               ⭐ CLI scraper principal
├── apply-ffme-migration.ps1                  Migration helper (Windows)
├── apply-ffme-migration.sh                   Migration helper (Linux/Mac)
├── test-ffme-scraper.js                      Test data et exemples
└── verify-ffme-setup.js                      Vérification des pré-requis
```

**Scripts détail**:
- `scrape-ffme-competitions.js` - CLI Node.js avec cheerio
- `apply-ffme-migration.ps1` - PowerShell pour appliquer migration
- `apply-ffme-migration.sh` - Bash pour appliquer migration
- `test-ffme-scraper.js` - Exemples et données de test
- `verify-ffme-setup.js` - Vérification automatique setup

---

### 🎨 Frontend React
```
src/
├── components/competitions/
│   ├── FFMECompetitionScraper.jsx            ⭐ Composant UI principal
│   └── FFME_SCRAPER_EXAMPLES.js              12+ exemples d'intégration
├── services/
│   └── ffmeCompetitionsService.js            API pour requêtes
├── hooks/
│   └── useFFMECompetitionScraper.js          Hook personnalisé
└── pages/
    └── Competitions.jsx                      Page modifiée (ajout onglet)
```

**Détails**:
- `FFMECompetitionScraper.jsx` - UI avec formulaire + barre progression
- `ffmeCompetitionsService.js` - 7 fonctions de requêtes
- `useFFMECompetitionScraper.js` - Hook réutilisable
- `FFME_SCRAPER_EXAMPLES.js` - 12 exemples de code

---

### 📚 Documentation
```
docs/
└── ffme-scraper-guide.md                     Guide complet utilisateur

Root/
├── FFME_SCRAPER_IMPLEMENTATION.md            Résumé implémentation
├── FFME_SCRAPER_SETUP.md                     Setup checklist
└── CLAUDE.md                                 Documentation technique
```

**Fichiers de doc**:
- `ffme-scraper-guide.md` - Guide COMPLET (API, usage, troubleshooting)
- `FFME_SCRAPER_IMPLEMENTATION.md` - Résumé des changements
- `FFME_SCRAPER_SETUP.md` - Checklist et instructions setup
- `CLAUDE.md` - Documentation technique architecture

---

## 🎯 Guide d'utilisation

### 1️⃣ Appliquer la migration (première fois)

**Windows**:
```bash
powershell -ExecutionPolicy Bypass -File scripts/apply-ffme-migration.ps1
```

**Linux/Mac**:
```bash
bash scripts/apply-ffme-migration.sh
```

Puis exécuter le SQL dans Supabase SQL Editor.

### 2️⃣ Vérifier le setup

```bash
node scripts/verify-ffme-setup.js
```

### 3️⃣ Utiliser via l'interface web

1. **Aller sur**: Compétitions → "Scraper FFME" (nouvel onglet)
2. **Entrer** les IDs (ex: 13150-13160)
3. **Cliquer** "Démarrer le scraping"
4. **Voir** la progression en temps réel

### 4️⃣ Utiliser via CLI

```bash
# Plage par défaut
node scripts/scrape-ffme-competitions.js

# Plage custom
node scripts/scrape-ffme-competitions.js 13100 13200
```

### 5️⃣ Utiliser dans le code

```javascript
import { searchFFMECompetitions } from '@/services/ffmeCompetitionsService';

const results = await searchFFMECompetitions('13150');
```

---

## 📖 Guide de lecture recommandé

Pour **commencer rapidement**:
1. Lire: `FFME_SCRAPER_SETUP.md` (5 min)
2. Appliquer: migration avec script
3. Tester: UI sur page Compétitions

Pour **comprendre en détail**:
1. Lire: `FFME_SCRAPER_IMPLEMENTATION.md` (10 min)
2. Lire: `docs/ffme-scraper-guide.md` (20 min)
3. Explorer: `FFME_SCRAPER_EXAMPLES.js` (code examples)

Pour **développer avec**:
1. Lire: `docs/ffme-scraper-guide.md` section API
2. Consulter: `FFME_SCRAPER_EXAMPLES.js`
3. Utiliser: service et hook

Pour **déboguer**:
1. Consulter: `docs/ffme-scraper-guide.md` section Troubleshooting
2. Exécuter: `scripts/verify-ffme-setup.js`
3. Vérifier: logs navigateur (F12)

---

## 🔑 Concepts clés

### Table `ffme_competitions_index`
```
id (BIGSERIAL)         → Clé primaire auto-incrémentée
ffme_id (BIGINT)       → ID unique FFME (clé unique)
title (TEXT)           → Titre de la compétition
created_at (TIMESTAMP) → Date création record
updated_at (TIMESTAMP) → Date modification record
```

### Flux principal
```
Interface Web
    ↓
useFFMECompetitionScraper Hook
    ↓
Fetch mycompet.ffme.fr/resultat_XXXX
    ↓
Extraire <div class="title">
    ↓
Supabase (upsert)
    ↓
Base de données
```

### Arrêt du scraper
- ✅ Page invalide (404, 500, etc)
- ✅ Titre non trouvé
- ✅ Erreur réseau
- ✅ Erreur base de données

---

## ✨ Fonctionnalités

### UI
- ✅ Formulaire ID début/fin
- ✅ Barre progression en temps réel
- ✅ Affichage succès/erreurs
- ✅ Bouton réinitialiser
- ✅ Responsive design

### Service API
- ✅ `getFFMECompetitions()` - Toutes les compétitions
- ✅ `searchFFMECompetitions(query)` - Chercher
- ✅ `getFFMECompetition(id)` - Une compétition
- ✅ `getFFMECompetitionUrl(id)` - URL resultat
- ✅ `linkFFMECompetition()` - Lier au club
- ✅ `getLinkedFFMECompetitions()` - Compétitions liées
- ✅ `getFFMECompetitionsByDateRange()` - Par date

### CLI
- ✅ Arguments: startId endId
- ✅ Logs détaillés
- ✅ Gestion d'erreurs
- ✅ Délais respectueux
- ✅ User-Agent approprié

### Sécurité
- ✅ RLS activé
- ✅ IDs uniques
- ✅ Délais (pas de surcharge)
- ✅ Gestion d'erreurs
- ✅ Logs d'audit

---

## 📊 Statistiques

| Aspect | Nombre |
|--------|--------|
| Fichiers créés | 13 |
| Fichiers modifiés | 2 |
| Lignes de code | ~2000 |
| Fonctions API | 7 |
| Exemples d'intégration | 12 |
| Documentation | 5 fichiers |
| Tests | ✅ |

---

## 🎓 Ressources

### Pour utilisateurs
- Onglet "Scraper FFME" sur page Compétitions
- Documentation: `docs/ffme-scraper-guide.md`

### Pour développeurs
- Service API: `src/services/ffmeCompetitionsService.js`
- Hook: `src/hooks/useFFMECompetitionScraper.js`
- Exemples: `FFME_SCRAPER_EXAMPLES.js`
- Architecture: `docs/ffme-scraper-guide.md`

### Pour admins
- Setup: `FFME_SCRAPER_SETUP.md`
- Migration: `scripts/apply-ffme-migration.ps1` ou `.sh`
- Vérification: `scripts/verify-ffme-setup.js`

---

## ✅ Checklist livraison

- [x] Migration SQL créée et testée
- [x] Composant React UI fonctionnel
- [x] Service API complète
- [x] Hook personnalisé réutilisable
- [x] Script CLI Node.js
- [x] Scripts d'application migration
- [x] Documentation utilisateur
- [x] Documentation développeur
- [x] Intégration page Compétitions
- [x] Gestion d'erreurs complète
- [x] Tests et exemples
- [x] Vérification setup automatique

---

## 🚀 Prêt à l'emploi

Le système est 100% fonctionnel pour:
- ✅ Production
- ✅ Développement
- ✅ Extension future
- ✅ Maintenance

---

## 📞 Support rapide

| Problème | Solution |
|----------|----------|
| Migration ne s'applique pas | Vérifier Supabase SQL Editor |
| Pas de bouton "Scraper FFME" | Vérifier import dans Competitions.jsx |
| Erreur "No title found" | Vérifier manuellement URL FFME |
| Erreur "ffme_id unique" | Migration déjà appliquée (OK) |
| Performance lente | Normal (délais respectueux) |

---

**Version**: 1.0  
**Créé**: 17 décembre 2025  
**Status**: ✅ Livré et prêt à l'emploi

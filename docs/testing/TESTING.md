# 🧪 Guide des tests E2E avec Cypress

Ce projet utilise **Cypress** pour les tests E2E (End-to-End) et génère automatiquement les tests en analysant votre configuration de navigation.

## 📋 Table des matières

- [Installation](#installation)
- [Utilisation](#utilisation)
- [Commandes disponibles](#commandes-disponibles)
- [Architecture](#architecture)
- [Résultats des tests](#résultats-des-tests)
- [Ajouter de nouvelles pages](#ajouter-de-nouvelles-pages)

## 🔧 Installation

Les dépendances Cypress et de reporting sont déjà installées. Si ce n'est pas le cas:

```bash
npm install --save-dev cypress mochawesome mochawesome-merge mochawesome-report-generator
```

## 🚀 Utilisation

### Générer les tests automatiquement

Les tests sont générés automatiquement en analysant `src/components/Navigation.jsx`:

```bash
npm run test:generate
```

Cela crée/met à jour le fichier `cypress/e2e/pages.cy.js` avec:
- Un test pour chaque page de votre menu
- Les rôles autorisés pour chaque page
- Des vérifications de chargement de page
- Des captures d'écran automatiques

### Exécuter les tests

#### Mode headless (sans interface)
```bash
npm run test:e2e
```

#### Mode interface (pour déboguer)
```bash
npm run test:e2e:ui
```

#### Mode debug (visible et sans quitter)
```bash
npm run test:e2e:debug
```

#### Mode watch (rerun automatique)
```bash
npm run test:watch
```

## 📊 Commandes disponibles

| Commande | Description |
|----------|-------------|
| `npm run test:generate` | Génère les tests depuis Navigation.jsx |
| `npm run test:e2e` | Exécute tous les tests (mode headless) |
| `npm run test:e2e:ui` | Ouvre l'interface Cypress interactive |
| `npm run test:e2e:debug` | Exécute les tests en mode visible (debugging) |
| `npm run test:report` | Fusionne les rapports et affiche le résultat |
| `npm run test:watch` | Exécute les tests en mode watch |

## 🏗️ Architecture

### Génération automatique des tests

Le script `scripts/generate-tests.cjs`:

1. **Lit** `src/components/Navigation.jsx`
2. **Extrait** toutes les pages et leurs rôles
3. **Génère** `cypress/e2e/pages.cy.js` avec les tests correspondants
4. **Affiche** un résumé des pages testées

**Exemple de sortie:**

```
✅ Trouvé 12 pages à tester

📊 RÉSUMÉ DES PAGES À TESTER:
  [1] Actualités (/news) - Rôles: [public, user, adherent, bureau, encadrant, admin]
  [2] Planning (/schedule) - Rôles: [public, user, adherent, bureau, encadrant, admin]
  [3] Séances (/session-log) - Rôles: [adherent, bureau, encadrant, admin]
  ...
```

### Structure des fichiers

```
cypress/
├── e2e/
│   └── pages.cy.js              ← Tests GÉNÉRÉS automatiquement
├── support/
│   └── e2e.js                   ← Configuration Cypress
├── reports/
│   └── mochawesome/             ← Rapports HTML
├── screenshots/                 ← Captures d'écran
└── videos/                      ← Vidéos des tests (optionnel)

scripts/
├── generate-tests.cjs           ← Génère les tests
└── merge-reports.cjs            ← Fusionne les rapports

cypress.config.js                ← Configuration Cypress
```

## 📊 Résultats des tests

### Rapport HTML

Après l'exécution des tests, un rapport HTML détaillé est généré:

```bash
npm run test:report
```

Le rapport contient:
- ✅ Résumé de tous les tests
- 📊 Graphiques de performance
- 🖼️ Captures d'écran des pages testées
- ⏱️ Temps d'exécution
- 🎥 Vidéos des tests (optionnel)

**Localisation:** `cypress/reports/mochawesome/mochawesome.html`

## ✏️ Ajouter de nouvelles pages

Quand vous ajoutez une nouvelle page:

### 1. Ajouter au menu (Navigation.jsx)

```javascript
const defaultNavLinks = [
  // ...
  {
    to: '/ma-nouvelle-page',
    text: 'Ma Nouvelle Page',
    roles: ['admin', 'encadrant']
  },
];
```

### 2. Régénérer les tests

```bash
npm run test:generate
```

C'est tout! La nouvelle page sera automatiquement testée.

## 🔍 Ce que Cypress teste

Chaque page testée vérifie:

✅ La page se charge correctement
✅ Pas d'erreur JavaScript
✅ Les éléments de la page sont visibles
✅ Les rôles autorisés sont respectés
✅ Les captures d'écran pour référence

## 🐛 Déboguer les tests

### Mode interactif

```bash
npm run test:e2e:ui
```

Cela ouvre l'interface Cypress où vous pouvez:
- Voir chaque étape du test
- Analyser les éléments du DOM
- Voir les logs de la console
- Reprendre les tests

### Mode debug

```bash
npm run test:e2e:debug
```

Les tests s'exécutent visiblement dans le navigateur, vous permettant de voir exactement ce qui se passe.

## 📝 Fichiers importants

| Fichier | Description |
|---------|-------------|
| `cypress.config.js` | Configuration Cypress |
| `cypress/e2e/pages.cy.js` | **Tests GÉNÉRÉS** (auto-généré) |
| `cypress/support/e2e.js` | Commandes et support globaux |
| `scripts/generate-tests.cjs` | Script de génération des tests |
| `scripts/merge-reports.cjs` | Script de fusion des rapports |

## ⚙️ Configuration

### Timeout des tests

Modifiez dans `cypress.config.js`:

```javascript
defaultCommandTimeout: 10000,      // 10 secondes
requestTimeout: 10000,             // 10 secondes
responseTimeout: 10000,            // 10 secondes
```

### URL de base

L'URL par défaut est configurée dans `cypress.config.js`:

```javascript
baseUrl: 'http://localhost:3000/ALJ_Jonage_Escalade',
```

## 🚨 Dépannage

### Les tests ne trouvent pas la page

1. Vérifiez que votre serveur local est lancé
2. Vérifiez que l'URL dans `cypress.config.js` est correcte
3. Régénérez les tests: `npm run test:generate`

### Erreurs d'authentification

Actuellement, les tests publiques fonctionnent sans authentification. Pour tester les pages protégées, vous devez configurer une authentification de test dans `cypress/e2e/pages.cy.js`.

### Rapports manquants

Assurez-vous que les tests ont bien s'exécutés:

```bash
npm run test:e2e && npm run test:report
```

## 📚 Ressources

- [Cypress Documentation](https://docs.cypress.io/)
- [Mochawesome Reports](https://github.com/adamgruber/mochawesome)

---

**Note:** Le fichier `cypress/e2e/pages.cy.js` est généré automatiquement et ne doit pas être modifié manuellement. Pour ajouter des tests personnalisés, créez un nouveau fichier dans `cypress/e2e/`.

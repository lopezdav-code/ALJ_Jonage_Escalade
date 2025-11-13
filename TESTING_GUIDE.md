# 🧪 Guide de Testing E2E - Club Escalade ALJ Jonage

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration locale](#configuration-locale)
3. [Exécution des tests](#exécution-des-tests)
4. [Structure des tests](#structure-des-tests)
5. [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
6. [Couverture des tests](#couverture-des-tests)
7. [Dépannage](#dépannage)

---

## 📊 Vue d'ensemble

### Statistiques actuelles

| Métrique | Valeur |
|----------|--------|
| **Tests totaux** | 206 |
| **Fichiers de test** | 11 |
| **Couverture pages** | 45%+ |
| **Croissance** | +1,772% (de 11 à 206) |

### Test Categories

- ✅ **Accessibility Tests** (5)
- ✅ **Navigation Tests** (14)
- ✅ **RBAC/Permission Tests** (27+)
- ✅ **Content Validation** (40+)
- ✅ **Admin Features** (35+)
- ✅ **Interactions** (27+)
- ✅ **Performance** (8+)

---

## 🔧 Configuration locale

### Prérequis

- **Node.js**: 18.x ou supérieur
- **npm**: 9.x ou supérieur
- **Cypress**: 15.6.0 (inclus dans les dépendances)
- **Chrome**: Navigateur Chrome installé

### Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd club-escalade-app

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local

# 4. Variables requises pour les tests
cat > .env.local << EOF
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=admin_password
TEST_BUREAU_EMAIL=bureau@test.com
TEST_BUREAU_PASSWORD=bureau_password
EOF
```

---

## 🧪 Exécution des tests

### Mode Headless (CLI)

```bash
# Exécuter tous les tests
npm run test:e2e

# Exécuter un fichier de test spécifique
npm run test:e2e -- --spec cypress/e2e/public-allowed.cy.js

# Exécuter un groupe de tests
npm run test:e2e -- --spec "cypress/e2e/admin*.cy.js"
```

### Mode Interactif

```bash
# Ouvrir l'interface Cypress
npm run test:e2e:ui

# Ou directement avec Cypress
npx cypress open
```

### Mode Debug

```bash
# Exécuter avec navigateur visible et sans fermeture
npm run test:e2e:debug

# Ou
npx cypress run --headed --browser chrome --no-exit
```

### Mode Watch

```bash
# Exécuter les tests en boucle (recharge au changement)
npm run test:watch
```

### Générer un rapport

```bash
# Créer le rapport HTML des résultats
npm run test:report
```

---

## 📁 Structure des tests

### Organisation des fichiers

```
cypress/
├── e2e/
│   ├── public-allowed.cy.js      # Pages publiques accessibles
│   ├── public-blocked.cy.js      # Pages bloquées sans auth
│   ├── bureau-allowed.cy.js      # Pages accessibles bureau
│   ├── bureau-blocked.cy.js      # Pages bloquées pour bureau
│   ├── admin.cy.js               # Pages admin (7 tests)
│   ├── admin-dashboard.cy.js     # Dashboard & management
│   ├── competitions.cy.js        # Pages compétitions
│   ├── sessions.cy.js            # Sessions & planning
│   ├── interactions.cy.js        # Navigation & interactions
│   ├── rbac-roles.cy.js          # RBAC matrice complète
│   └── news-articles.cy.js       # Actualités & contenu
├── support/
│   ├── commands.js               # Custom commands
│   └── e2e.js                    # Configuration
├── cypress.config.cjs            # Config Cypress
└── reports/                      # Rapports générés
```

### Pattern des tests

Chaque fichier de test suit ce pattern:

```javascript
describe('📋 Catégorie - Description', () => {
  // Setup - Connexion si nécessaire
  beforeEach(() => {
    // Connexion avec cy.session()
    cy.session(...);
  });

  // Tests
  it('devrait afficher la page /path', () => {
    cy.visit('/path');
    cy.url().should('include', '/path');
    cy.contains('h1', /title/i).should('exist');
    cy.contains('h1', /Accès restreint/i).should('not.exist');
  });
});
```

### Conventions de nommage

```javascript
it('devrait [action] [résultat attendu]', () => {
  // Arrange
  cy.visit('/path');

  // Act
  cy.get('button').click();

  // Assert
  cy.contains('success message').should('be.visible');
});
```

---

## 🚀 CI/CD avec GitHub Actions

### Workflow automatique

Les tests s'exécutent automatiquement sur:
- ✅ **Push sur main ou develop**
- ✅ **Pull Requests vers main ou develop**

### Workflow détaillé

```yaml
name: 🧪 E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      1. Checkout code
      2. Setup Node.js
      3. Install dependencies
      4. Build project
      5. Start dev server
      6. Run Cypress tests
      7. Upload reports & artifacts
      8. Comment on PR with results
```

### Secrets requis

Configurer ces secrets dans GitHub (Settings → Secrets):

```
VITE_SUPABASE_URL          # URL Supabase
VITE_SUPABASE_ANON_KEY     # Clé anonyme Supabase
TEST_ADMIN_EMAIL           # Email admin pour tests
TEST_ADMIN_PASSWORD        # Mot de passe admin
TEST_BUREAU_EMAIL          # Email bureau pour tests
TEST_BUREAU_PASSWORD       # Mot de passe bureau
CYPRESS_PROJECT_ID         # ID projet Cypress (optionnel)
CYPRESS_RECORD_KEY         # Clé enregistrement Cypress (optionnel)
```

### Configuration GitHub

```bash
# 1. Aller sur Settings → Secrets and variables → Actions
# 2. Cliquer sur "New repository secret"
# 3. Ajouter chaque secret avec sa valeur
```

### Voir les résultats

1. **Aller sur Actions** dans GitHub
2. **Sélectionner le workflow** "🧪 E2E Tests"
3. **Voir les détails** du run
4. **Télécharger les artefacts**:
   - 📊 `cypress-reports/` - Rapports HTML
   - 📸 `cypress-screenshots/` - Screenshots en cas d'erreur
   - 🎥 `cypress-videos/` - Vidéos des tests
   - 📝 `coverage-summary.md` - Résumé couverture

### Résultats sur PR

Après chaque PR:
- ✅ Résultats des tests affichés en commentaire
- ✅ Rapports disponibles en artefacts
- ✅ Vidéos des tests échoués

---

## 🎯 Couverture des tests

### Pages testées (25+)

#### Pages Publiques (5)
```
/ (Accueil)
/news (Actualités)
/inscriptions (Inscriptions)
/schedule (Planning)
/contact (Contact)
```

#### Pages Bureau (2)
```
/volunteers (Adhérents)
/bureau-management (Gestion Bureau)
```

#### Pages Admin (7+)
```
/admin-dashboard (Dashboard)
/site-settings (Réglages)
/admin-management (Gestion)
/user-roles (Rôles)
/permissions (Permissions)
/access-logs (Logs d'accès)
/database-management (Base de données)
```

#### Pages Contenu (4+)
```
/competitions (Compétitions)
/competitions-summary
/federal-calendar
/session-log (Sessions)
```

### Matrice RBAC

```
Role      | Pages Accessibles | Pages Bloquées | Tests
----------|-------------------|----------------|-------
Public    | 5 pages           | Admin, Bureau  | ✅
Bureau    | 2 pages           | Admin-only     | ✅
Admin     | TOUTES            | AUCUNE         | ✅
```

### Types de tests

| Catégorie | Nombre | Couverture |
|-----------|--------|-----------|
| Accessibilité | 5 | Pages publiques |
| Navigation | 14 | Liens, menus |
| RBAC | 27+ | Contrôle d'accès |
| Contenu | 40+ | Structure pages |
| Admin | 35+ | Fonctionnalités |
| Interactions | 27+ | Clics, navigation |
| Performance | 8+ | Vitesse chargement |

---

## 🔍 Dépannage

### Erreur: "Illegal instruction" Node.js

**Symptôme**: `Illegal instruction` lors de `npm run test:e2e`

**Solution**:
```bash
# 1. Réinstaller Node.js
nvm install 18.20.0
nvm use 18.20.0

# 2. Ou installer une version stable
brew install node@18  # macOS
choco install nodejs  # Windows
```

### Erreur: "Server failed to start"

**Symptôme**: Tests échouent avec "Server is not ready"

**Solution**:
```bash
# 1. Vérifier les variables d'env
echo $VITE_SUPABASE_URL

# 2. Vérifier le port 3000 est libre
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# 3. Tuer le processus si présent
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# 4. Réessayer
npm run test:e2e
```

### Erreur: "Timeout retrying after 10000ms"

**Symptôme**: Test timeout pendant cy.visit()

**Solution**:
```javascript
// Augmenter le timeout
cy.visit('/path', { failOnStatusCode: false });
cy.get('body', { timeout: 10000 }).should('be.visible');
```

### Erreur: "Cannot login with credentials"

**Symptôme**: Tests auth échouent

**Solution**:
```bash
# 1. Vérifier les credentials dans .env.local
cat .env.local | grep TEST_

# 2. Vérifier les utilisateurs de test existent
# Dans Supabase Auth → Users

# 3. Tester la connexion manuelle
# Dans l'app, essayer de se connecter
```

### Screenshots/Vidéos non générées

**Solution**:
```bash
# Vérifier les permissions
ls -la cypress/screenshots/
ls -la cypress/videos/

# Donner les permissions
chmod 755 cypress/screenshots
chmod 755 cypress/videos
```

---

## 📚 Ressources

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Cypress API](https://docs.cypress.io/api/table-of-contents)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

---

## 🎯 Prochaines étapes

### Phase 3 - Tests avancés
- [ ] Tests de formulaires (CRUD)
- [ ] Tests de recherche/filtrage
- [ ] Tests de pagination
- [ ] Tests de gestion d'erreurs
- [ ] Tests responsivité mobile

### Phase 4 - Optimisation
- [ ] Tests de performance
- [ ] Tests de load
- [ ] Tests d'accessibilité (a11y)
- [ ] Tests d'intégration API

---

**Dernière mise à jour**: 13 novembre 2024
**Version**: 2.0 (Phase 2)
**Auteur**: Team Development

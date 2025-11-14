# Configuration des tests Cypress avec authentification réelle

## 📋 Vue d'ensemble

Les tests E2E utilisent maintenant une **authentification réelle** avec email/password au lieu de tokens mock. Cela permet de tester les vrais workflows de connexion.

## 🔧 Configuration GitHub Secrets

Pour que les tests fonctionnent, vous devez configurer les secrets GitHub suivants:

### Secrets à ajouter dans GitHub

Allez dans: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Créez les 4 secrets suivants:

| Nom du secret | Valeur | Description |
|---|---|---|
| `TEST_BUREAU_EMAIL` | Email du compte Bureau | Ex: `bureau@escalade.club` |
| `TEST_BUREAU_PASSWORD` | Mot de passe du compte Bureau | Doit être sécurisé |
| `TEST_ADMIN_EMAIL` | Email du compte Admin | Ex: `admin@escalade.club` |
| `TEST_ADMIN_PASSWORD` | Mot de passe du compte Admin | Doit être sécurisé |
| `VITE_SUPABASE_URL` | URL Supabase | Déjà configuré |
| `VITE_SUPABASE_ANON_KEY` | Clé anon Supabase | Déjà configuré |

## 📝 Fichiers de test

### Nouveau fichier de test simplifié

**`cypress/e2e/real-credentials.cy.js`** - Tests avec authentification réelle

Contient 4 cas de test:

1. **Sans connexion** → `/volunteers` affiche "Accès restreint"
2. **Bureau login** → `/volunteers` affiche une liste de noms
3. **Bureau login** → `/site-settings` affiche "Accès non autorisé"
4. **Admin login** → `/site-settings` affiche "Réglages du site"

### Anciens fichiers (commentés)

- `cypress/e2e/pages.cy.js` - Tests générés automatiquement (désactivés)
- `cypress/e2e/volunteers-permissions.cy.js` - Tests avec tokens mock (désactivés)

## 🚀 Exécution locale

Pour tester localement, créez un fichier `.env.local` à la racine:

```env
# Credentials pour les tests
TEST_BUREAU_EMAIL=votre_email_bureau@example.com
TEST_BUREAU_PASSWORD=votre_mot_de_passe
TEST_ADMIN_EMAIL=votre_email_admin@example.com
TEST_ADMIN_PASSWORD=votre_mot_de_passe

# Supabase (optionnel, déjà dans cypress.env.json)
VITE_SUPABASE_URL=https://hvugiirundpxynozxxnd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Puis exécutez:

```bash
# Mode headless
npm run test:e2e

# Mode interactif
npx cypress open --config baseUrl=http://localhost:3000/ALJ_Jonage_Escalade
```

## 🔐 Sécurité

⚠️ **IMPORTANT**:
- **.env.local** est dans `.gitignore` → Ne sera jamais poussé
- **GitHub Secrets** sont chiffrés → Accessibles uniquement aux workflows autorisés
- **Ne commettez JAMAIS** de mots de passe dans le code

## 📊 Rapports de test

Après l'exécution des tests:

```bash
# Voir le rapport HTML
npm run test:report
```

Les rapports sont générés dans `cypress/reports/` avec:
- Screenshots de chaque test
- Vidéos d'exécution
- Logs détaillés

## 🔍 Commandes Cypress disponibles

### Authentification

```javascript
// Authentification réelle avec email/password
cy.loginWithCredentials('email@example.com', 'password');

// Authentification mock (ancienne méthode)
cy.loginAsUser('admin');   // admin, bureau, encadrant, adherent
cy.loginAsAdmin();         // Alias pour loginAsUser('admin')
```

### Utilitaires

```javascript
// Attendre le chargement complet de la page
cy.waitForPageLoad();

// Vérifier que la page s'est chargée correctement
cy.checkPageLoad('Page Name');

// Prendre une screenshot avec timestamp
cy.saveScreenshot('prefix');
```

## 🛠️ Modification des sélecteurs de formulaire

Si votre formulaire de login utilise des sélecteurs différents, modifiez la commande dans `cypress/support/e2e.js`:

```javascript
// Exemple: si votre formulaire utilise des classes custom
cy.get('.login-email, input.email-input')
  .type(email);
cy.get('.login-password, input.password-input')
  .type(password);
cy.get('.btn-submit, .login-button')
  .click();
```

## 📚 Ressources

- [Documentation Cypress](https://docs.cypress.io)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

## ❓ Troubleshooting

### Erreur: "Variables manquantes: TEST_BUREAU_EMAIL ou TEST_BUREAU_PASSWORD"

**Solution**: Assurez-vous que les GitHub Secrets sont configurés. En local, créez `.env.local`.

### Le login échoue

**Solutions possibles**:
1. Vérifiez que les identifiants sont corrects
2. Vérifiez que les sélecteurs CSS correspondent à votre formulaire
3. Vérifiez les logs du navigateur dans Cypress UI

### Screenshots vides ou avec "Chargement..."

Les tests attendent maintenant que les loaders disparaissent avec `.should('not.exist')`. Si la page a des loaders qui ne disparaissent jamais, vérifiez:
1. Le sélecteur `[class*="loader"], [class*="loading"]`
2. La logique de chargement dans votre application

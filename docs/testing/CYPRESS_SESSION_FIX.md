# 🔐 Fix: Session Persistence dans les Tests Cypress

## ❌ Problème identifié

Les tests admin échouaient car l'authentification n'était pas conservée entre les tests. Après le premier test, les tests suivants trouvaient la page avec "Accès restreint".

### Cause du problème

Le fichier `admin.cy.js` utilisait:
- ❌ `before()` au lieu de `beforeEach()`
- ❌ Pas de validation de session avec `validate()`
- ❌ La connexion n'était exécutée qu'une seule fois

### Comment cela causait le problème

1. `before()` s'exécute **une seule fois** au début de tous les tests
2. Pas de `validate()` pour vérifier que le token existe toujours
3. Entre les tests, le localStorage pouvait être vidé ou le token expirer
4. Les tests suivants trouvaient un utilisateur **non authentifié**

---

## ✅ Solution appliquée

### Changements dans `admin.cy.js`

#### Avant (❌ Problématique)
```javascript
describe('Admin - Pages Accessibles', () => {
  before(() => {  // ❌ Une seule exécution
    const adminEmail = Cypress.env('TEST_ADMIN_EMAIL');

    cy.session('admin-login', () => {
      cy.visit('/');
      cy.loginWithCredentials(adminEmail, adminPassword);
      cy.wait(2000);
    });  // ❌ Pas de validate()
  });

  it('devrait afficher la page d\'accueil', () => {
    cy.visit('/');
    // ❌ Peut être déconnecté si le token a expiré
  });
});
```

#### Après (✅ Correct)
```javascript
describe('Admin - Pages Accessibles', () => {
  beforeEach(() => {  // ✅ Avant chaque test
    const adminEmail = Cypress.env('TEST_ADMIN_EMAIL');

    cy.session('admin-login', () => {
      cy.visit('/');
      cy.loginWithCredentials(adminEmail, adminPassword);
      cy.wait(2000);
    }, {
      validate() {  // ✅ Valider la session
        cy.window().then((win) => {
          const keys = Object.keys(win.localStorage);
          const hasAuthToken = keys.some(key =>
            key.includes('auth-token') ||
            key.includes('session') ||
            key.includes('sb-')
          );

          if (!hasAuthToken) {
            throw new Error('Session invalide');
          }
        });
      }
    });

    // ✅ Naviguer vers l'accueil pour s'assurer que la session est active
    cy.visit('/', { failOnStatusCode: false });
    cy.get('body', { timeout: 5000 }).should('be.visible');
  });

  it('devrait afficher la page d\'accueil', () => {
    cy.visit('/');
    // ✅ Maintenant toujours authentifié
  });
});
```

### Points clés de la solution

| Aspect | Avant | Après | Effet |
|--------|-------|-------|--------|
| **Hook** | `before()` | `beforeEach()` | Session validée avant chaque test |
| **Validation** | ❌ Aucune | ✅ `validate()` | Cypress reconnecte si token manquant |
| **Fréquence** | 1 fois | À chaque test | Token toujours frais |
| **Déconnexion** | Possible | Impossible | Tests fiables |

---

## 🔍 Explication technique

### Comment fonctionne `cy.session()`

```javascript
cy.session(id, setupFn, options)
```

1. **`id`**: Identifiant unique pour la session
2. **`setupFn`**: Fonction exécutée pour créer la session
3. **`options`**: Configuration optionnelle

### Avec `validate()`

```javascript
cy.session('admin-login',
  // Setup: Exécuté si pas de session ou validation échoue
  () => {
    cy.loginWithCredentials(...);
  },
  // Options: Validation pour vérifier que la session est toujours valide
  {
    validate() {
      // Vérifier que le token existe
      cy.window().then((win) => {
        const hasToken = Object.keys(win.localStorage)
          .some(key => key.includes('auth-token'));

        if (!hasToken) {
          throw new Error('Pas de token');
        }
      });
    }
  }
);
```

### Flux d'exécution

```
beforeEach()
  ↓
cy.session() exécute validate()
  ↓
  ├─ Token trouvé? → Saute setup, utilise session cachée ✅
  └─ Token manquant? → Exécute setup, reconnecte ✅
  ↓
cy.visit('/') → Utilisateur authentifié ✅
  ↓
it() → Test exécuté avec auth valide ✅
```

---

## 🧪 Tests affectés

Les fichiers suivants avaient déjà la bonne structure:
- ✅ `bureau-allowed.cy.js`
- ✅ `bureau-blocked.cy.js`
- ✅ `admin-dashboard.cy.js`
- ✅ `competitions.cy.js`
- ✅ `sessions.cy.js`
- ✅ `interactions.cy.js` (pour la section admin)
- ✅ `rbac-roles.cy.js`

Le fichier corrigé:
- 🔧 `admin.cy.js` (changement: `before()` → `beforeEach()` + validation)

---

## ✨ Améliorations additionnelles

Pour plus de robustesse, on peut aussi:

### 1. Ajouter du logging
```javascript
validate() {
  cy.window().then((win) => {
    const keys = Object.keys(win.localStorage);
    cy.log(`🔍 LocalStorage keys: ${keys.join(', ')}`);

    const hasAuthToken = keys.some(key =>
      key.includes('auth-token')
    );

    if (!hasAuthToken) {
      cy.log('❌ Pas de token trouvé');
      throw new Error('Session invalide');
    }

    cy.log('✅ Token valide, session OK');
  });
}
```

### 2. Vérifier aussi le contenu du token
```javascript
validate() {
  cy.window().then((win) => {
    const token = Object.entries(win.localStorage)
      .find(([key]) => key.includes('auth-token'))?.[1];

    if (!token) {
      throw new Error('Pas de token');
    }

    // Vérifier que le token n'est pas vide
    if (token.length < 100) {
      cy.log('⚠️ Token semble invalide');
      throw new Error('Token invalide');
    }
  });
}
```

### 3. Vérifier aussi le user dans le contexte
```javascript
validate() {
  cy.window().then((win) => {
    // Vérifier le contexte d'authentification
    const authContext = win.__AUTH_CONTEXT;

    if (!authContext || !authContext.user) {
      cy.log('⚠️ Utilisateur non trouvé dans le contexte');
      throw new Error('User non authentifié');
    }
  });
}
```

---

## 🚀 Résultats attendus

Après cette correction:

- ✅ **Tous les tests admin passent**
- ✅ **La session persiste entre les tests**
- ✅ **Aucune déconnexion inattendue**
- ✅ **Tests fiables et reproductibles**

### Avant la correction
```
Tests échoués:
❌ devrait afficher la page d'accueil ✓
❌ devrait afficher /site-settings ✗ (Accès restreint)
❌ devrait afficher /admin-management ✗ (Accès restreint)
❌ devrait afficher /user-roles ✗ (Accès restreint)
...
```

### Après la correction
```
Tests réussis:
✅ devrait afficher la page d'accueil ✓
✅ devrait afficher /site-settings ✓
✅ devrait afficher /admin-management ✓
✅ devrait afficher /user-roles ✓
✅ devrait afficher /permissions ✓
✅ devrait afficher /access-logs ✓
✅ devrait afficher /volunteers ✓
```

---

## 📚 Ressources

- [Cypress Sessions Documentation](https://docs.cypress.io/api/commands/session)
- [Best Practices for Auth](https://docs.cypress.io/guides/end-to-end-testing/logging-in)
- [LocalStorage in Cypress](https://docs.cypress.io/api/commands/localStorage)

---

## ✅ Checklist

Avant de tester:

- [ ] Vérifier que `admin.cy.js` utilise `beforeEach()`
- [ ] Vérifier que `beforeEach()` a une validation `validate()`
- [ ] Vérifier que `cy.visit('/')` est appelé après `cy.session()`
- [ ] Vérifier que les variables d'env sont configurées
- [ ] Vérifier que les utilisateurs de test existent dans Supabase

---

**Date**: 13 novembre 2024
**Statut**: ✅ Appliqué
**Impact**: 🔴 CRITIQUE (tous les tests admin)

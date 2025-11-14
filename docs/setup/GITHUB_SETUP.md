# ⚙️ Configuration GitHub Actions - Club Escalade

## 📝 Guide de configuration des Secrets et Variables

Ce guide explique comment configurer le pipeline CI/CD GitHub Actions pour exécuter les tests Cypress automatiquement.

---

## 🔐 Secrets requis

### Étape 1 : Accéder aux paramètres des Secrets

1. Aller à votre repository sur GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Cliquer sur **New repository secret**

### Étape 2 : Ajouter chaque secret

#### 1. VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co
```

#### 2. VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: your-anon-key-from-supabase
```

#### 3. TEST_ADMIN_EMAIL
```
Name: TEST_ADMIN_EMAIL
Value: admin@test.example.com
```

**Important**: Cet utilisateur doit exister dans Supabase Auth avec le rôle **Admin**

#### 4. TEST_ADMIN_PASSWORD
```
Name: TEST_ADMIN_PASSWORD
Value: strong_admin_password_123
```

#### 5. TEST_BUREAU_EMAIL
```
Name: TEST_BUREAU_EMAIL
Value: bureau@test.example.com
```

**Important**: Cet utilisateur doit exister dans Supabase Auth avec le rôle **Bureau**

#### 6. TEST_BUREAU_PASSWORD
```
Name: TEST_BUREAU_PASSWORD
Value: strong_bureau_password_456
```

#### 7. CYPRESS_PROJECT_ID (Optionnel)
```
Name: CYPRESS_PROJECT_ID
Value: your-cypress-project-id
```

Pour intégration Cypress Cloud (enregistrement des vidéos)

#### 8. CYPRESS_RECORD_KEY (Optionnel)
```
Name: CYPRESS_RECORD_KEY
Value: your-cypress-record-key
```

Pour enregistrer les résultats sur Cypress Cloud

---

## ✅ Checklist de configuration

- [ ] VITE_SUPABASE_URL configuré
- [ ] VITE_SUPABASE_ANON_KEY configuré
- [ ] TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD configurés
- [ ] TEST_BUREAU_EMAIL et TEST_BUREAU_PASSWORD configurés
- [ ] Utilisateurs de test créés dans Supabase Auth
- [ ] CYPRESS_PROJECT_ID configuré (optionnel)
- [ ] CYPRESS_RECORD_KEY configuré (optionnel)

---

## 🧪 Utilisateurs de test Supabase

### Créer les utilisateurs de test

1. Aller à **Supabase Dashboard** → **Authentication** → **Users**
2. Cliquer sur **Add user**
3. Ajouter chaque utilisateur:

#### Utilisateur Admin
```
Email: admin@test.example.com
Password: strong_admin_password_123
Confirmed email: ✓
```

Puis affecter le rôle **Admin** dans la table `user_roles`

#### Utilisateur Bureau
```
Email: bureau@test.example.com
Password: strong_bureau_password_456
Confirmed email: ✓
```

Puis affecter le rôle **Bureau** dans la table `user_roles`

---

## 🚀 Workflow CI/CD

### Déclenchement automatique

Le workflow s'exécute automatiquement à chaque:
- ✅ **Push sur `main`**
- ✅ **Push sur `develop`**
- ✅ **Pull Request vers `main` ou `develop`**

### Étapes du workflow

1. **Checkout** - Clone le code
2. **Setup Node.js** - Configure Node 18.x
3. **Install dependencies** - npm ci
4. **Build** - npm run build
5. **Start server** - npm run dev
6. **Run tests** - Cypress run
7. **Upload reports** - Artefacts GitHub
8. **Comment PR** - Résultats sur PR

### Temps d'exécution

- ⏱️ **Temps moyen**: 5-10 minutes
- ⏱️ **Tests**: ~2-3 minutes
- ⏱️ **Build**: ~2-3 minutes
- ⏱️ **Startup**: ~1-2 minutes

---

## 📊 Résultats et rapports

### Voir les résultats

1. **Aller sur** `Actions` dans GitHub
2. **Sélectionner** le workflow "🧪 E2E Tests"
3. **Voir l'état**: ✅ Passed ou ❌ Failed

### Artefacts disponibles

Après chaque run:
- 📊 **cypress-reports/** - Rapport HTML mochawesome
- 📸 **cypress-screenshots/** - Screenshots en cas d'erreur
- 🎥 **cypress-videos/** - Vidéos des tests
- 📝 **coverage-summary.md** - Résumé de couverture

### Télécharger les artefacts

```bash
# Via GitHub CLI
gh run download <run-id> -n cypress-reports

# Via web
1. Cliquer sur le run
2. Scroller jusqu'à "Artifacts"
3. Cliquer sur l'artefact à télécharger
```

---

## 🔍 Dépannage

### ❌ Tests échouent avec "Cannot find user"

**Cause**: Les utilisateurs de test ne sont pas créés

**Solution**:
1. Créer les utilisateurs dans Supabase Auth
2. Vérifier les credentials dans les secrets
3. Réexécuter le workflow

### ❌ Erreur: "Server failed to start"

**Cause**: Supabase n'est pas accessible

**Solution**:
1. Vérifier VITE_SUPABASE_URL est correct
2. Vérifier VITE_SUPABASE_ANON_KEY est correct
3. Vérifier la base de données est accessible

### ❌ Timeout sur Cypress

**Cause**: Tests trop longs ou serveur lent

**Solution**:
1. Vérifier les timeouts dans les tests
2. Vérifier la performance du serveur
3. Augmenter les timeouts si nécessaire

---

## 📚 Configuration avancée

### Exécuter les tests sur d'autres branches

Modifier `.github/workflows/test.yml`:

```yaml
on:
  push:
    branches: [ main, develop, staging ]  # Ajouter 'staging'
  pull_request:
    branches: [ main, develop, staging ]
```

### Ajouter des navigateurs supplémentaires

```yaml
- name: 🧪 Run Cypress tests
  uses: cypress-io/github-action@v6
  with:
    browser: chrome,firefox,edge  # Plusieurs navigateurs
```

### Exécuter un seul fichier de test

```yaml
with:
  spec: cypress/e2e/admin.cy.js  # Un seul fichier
```

### Exécuter les tests en parallèle

```yaml
strategy:
  matrix:
    browser: [chrome, firefox]
```

---

## 🎯 Bonnes pratiques

### Pour les Pull Requests

- ✅ Toujours exécuter les tests avant de merger
- ✅ Corriger les tests échoués avant merge
- ✅ Vérifier les artefacts en cas d'erreur
- ✅ Lire les commentaires de résultats

### Pour les commits

- ✅ Exécuter `npm run test:e2e` localement
- ✅ Fixer les erreurs avant de push
- ✅ Ajouter des tests pour les nouvelles features

### Maintenance

- ✅ Revoir les tests tous les mois
- ✅ Mettre à jour les credentials
- ✅ Nettoyer les artefacts anciens
- ✅ Documenter les tests

---

## 📞 Support

En cas de problème:

1. **Vérifier les logs** - Actions → Run logs
2. **Vérifier les secrets** - Settings → Secrets
3. **Vérifier Supabase** - Auth → Users
4. **Relancer le workflow** - Re-run jobs

---

**Dernière mise à jour**: 13 novembre 2024
**Version**: 2.0
**Statut**: ✅ Production

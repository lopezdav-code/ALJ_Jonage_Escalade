# 🚀 GitHub Actions - Workflow des tests E2E

Ce document explique comment les tests E2E sont exécutés automatiquement via GitHub Actions.

## 📋 Workflows configurés

### 1. `test.yml` - Tests sur main et develop
**Déclenché par:**
- ✅ Push sur `main`
- ✅ Push sur `develop`
- ✅ Pull requests vers `main` ou `develop`

**Actions:**
```
1. Setup Node.js 18.x
2. Installer les dépendances
3. Build du projet
4. Lancement du serveur de dev
5. Exécution des tests Cypress
6. Génération du rapport
7. Upload des artefacts
8. Commentaire automatique sur les PR
```

### 2. `test-all-branches.yml` - Tests sur toutes les branches
**Déclenché par:**
- ✅ Chaque push (toutes les branches)
- ✅ Chaque pull request

**Actions:**
```
1. Setup Node.js
2. Installer les dépendances
3. Build (avec continue-on-error)
4. Lancement du serveur
5. Exécution des tests
6. Upload des artefacts
```

---

## 📊 Résultats et artefacts

### Artifacts disponibles après chaque exécution:

| Artifact | Description | Rétention |
|----------|-------------|-----------|
| `cypress-reports/` | Rapport HTML Mochawesome | 30 jours |
| `cypress-screenshots/` | Screenshots (en cas d'échec) | 7 jours |
| `cypress-videos/` | Vidéos des tests | 7 jours |
| `coverage-summary` | Résumé de couverture | 30 jours |

### Accès aux artefacts:

1. Allez à l'onglet **Actions** du repository
2. Cliquez sur le workflow run
3. Descendez à la section **Artifacts**
4. Téléchargez le rapport

---

## 🔔 Notifications

### Commentaires automatiques sur les PR

Quand vous créez une PR, GitHub Actions affichera automatiquement:

```
## 🧪 Test Results

| Métrique | Valeur |
|----------|--------|
| ✅ Réussis | 12 |
| ❌ Échoués | 0 |
| ⏭️ Ignorés | 0 |
| ⏱️ Durée | 45.23s |

**Rapport complet:** Consultez les artefacts ci-dessous...
```

### Check Status

GitHub affichera le statut des tests directement dans la PR:
- ✅ Tous les tests réussis → PR peut être mergée
- ❌ Tests échoués → PR bloquée jusqu'à correction

---

## 🔧 Configuration requise

### Variables d'environnement secrets

Vous devez ajouter les secrets GitHub pour le serveur de dev:

```bash
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Pour ajouter les secrets:**
1. Allez à Settings → Secrets and variables → Actions
2. Cliquez sur "New repository secret"
3. Ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`

---

## 📝 Pages testées (12)

Le workflow teste automatiquement:

```
1. Actualités (/news) - PUBLIC
2. Planning (/schedule) - PUBLIC
3. Inscription (/inscriptions) - PUBLIC
4. Contact (/contact) - PUBLIC
5. Adhérent (/volunteers) - ADHERENT+
6. Compétitions (/competitions) - ADHERENT+
7. Agenda (/agenda) - PUBLIC
8. Historique des séances (/session-log) - ADHERENT+
9. Gestion des cycles (/cycles) - BUREAU+
10. Validation Passeports (/passeport-validation) - BUREAU+
11. Récapitulatif des présences (/attendance-recap) - BUREAU+
12. Support Pédagogique (/pedagogy) - ADHERENT+
```

---

## 🎯 Ajouter de nouvelles pages aux tests

Quand vous ajoutez une nouvelle page:

1. **Ajoutez au menu** (`src/components/Navigation.jsx`)
   ```javascript
   {
     to: '/ma-nouvelle-page',
     text: 'Ma Nouvelle Page',
     roles: ['admin']
   }
   ```

2. **Régénérez les tests localement** (optionnel)
   ```bash
   npm run test:generate
   ```

3. **Committez et poussez**
   ```bash
   git add .
   git commit -m "feat: add new page"
   git push
   ```

4. **GitHub Actions refait les tests automatiquement!**

---

## 🔍 Dépannage

### Les tests ne démarrent pas

**Vérifiez:**
1. ✅ Node.js 18+ installé
2. ✅ Secrets GitHub configurés
3. ✅ Serveur Supabase accessible
4. ✅ Port 3000 disponible

### Tests timeout

**Solutions:**
1. Augmentez le timeout dans `cypress.config.js`
2. Réduisez la taille des tests
3. Vérifiez la latence réseau

### Rapports manquants

Les rapports ne sont uploadés que si les tests tournent complètement. Vérifiez les logs du workflow.

---

## 📈 Monitoring

### Dashboard GitHub Actions

1. Allez à Actions → All workflows
2. Voyez l'historique de tous les tests
3. Cliquez sur un run pour voir les détails
4. Téléchargez les artefacts

### Badge dans README

Vous pouvez ajouter un badge de statut:

```markdown
[![Tests](https://github.com/YOUR-USER/ALJ_Jonage_Escalade/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR-USER/ALJ_Jonage_Escalade/actions/workflows/test.yml)
```

---

## 🚀 Workflow complet

```
Developer push code to GitHub
    ↓
GitHub Actions triggered
    ↓
1. Setup environment (Node, dependencies)
    ↓
2. Build project
    ↓
3. Start dev server
    ↓
4. Run Cypress tests
    ↓
5. Generate report
    ↓
6. Upload artifacts
    ↓
7. Post comment on PR (if PR)
    ↓
✅ All done! Developers see results immediately
```

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cypress GitHub Action](https://github.com/cypress-io/github-action)
- [Mochawesome Reports](https://github.com/adamgruber/mochawesome)

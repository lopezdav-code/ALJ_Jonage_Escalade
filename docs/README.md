# Documentation du Projet ALJ Jonage Escalade

Ce dossier contient toute la documentation du projet, organisée par catégorie.

## 📁 Structure de la Documentation

### `/guides/`
Documentation des fonctionnalités et systèmes de l'application :
- **image-management-system.md** - Système de gestion des images
- **cycle-management-guide.md** - Gestion des cycles
- **passeport-system-guide.md** - Système de passeports
- **roles-permissions-guide.md** - Rôles et permissions
- **module-system-guide.md** - Architecture des modules
- Et autres guides fonctionnels...

### `/setup/`
Guides d'installation et de configuration :
- **GITHUB_SETUP.md** - Configuration GitHub et CI/CD
- **CYPRESS_SETUP.md** - Configuration des tests E2E
- **DEPLOYMENT.md** - Procédures de déploiement

### `/testing/`
Documentation des tests :
- **TESTING_GUIDE.md** - Guide complet des tests
- **TESTING.md** - Informations générales sur les tests
- **CYPRESS_SESSION_FIX.md** - Corrections des problèmes de session

### `/refactoring/`
Notes et plans de refactoring :
- **REFACTORING_PLAN.md** - Plan de refactoring
- **REFACTORING_SUMMARY.md** - Résumé des refactorings effectués

### `/migrations/`
Documentation des migrations de base de données :
- **MIGRATION_SCHEDULE_README.md** - Guide des migrations de planning
- **GUIDE-TABLE-CREATION.md** - Guide de création de tables

## 📄 Documentation Racine

Certains fichiers de documentation restent à la racine du projet pour une meilleure visibilité :
- **PR_DESCRIPTION.md** - Template pour les Pull Requests
- **PAGES_ACCESS_AUDIT.md** - Audit des contrôles d'accès
- **COMMENTAIRES_ELEVES.md** - Commentaires des élèves
- **RÉSUMÉ-IMAGES-SOLUTION.md** - Résumé de la solution images

## 🔄 Historique de Réorganisation

**Date** : 2025-11-14

**Changements effectués** :
1. Création de la structure en sous-dossiers thématiques
2. Migration des fichiers de documentation dispersés
3. Consolidation des guides de setup, testing, et refactoring
4. Amélioration de la découvrabilité des documents

## 📝 Conventions

- Les fichiers en **MAJUSCULES.md** sont des documents importants ou historiques
- Les fichiers en **minuscules-avec-tirets.md** sont des guides détaillés
- Chaque sous-dossier contient des documents liés par thème
- Les documents obsolètes sont archivés, pas supprimés

## 🔗 Liens Utiles

- [GitHub Actions](.github/workflows/)
- [Tests Cypress](../cypress/)
- [Migrations SQL](../migrations/)
- [Code Source](../src/)

# Migrations SQL - ALJ Jonage Escalade

Ce dossier contient toutes les migrations SQL pour la base de données du projet.

## 📁 Structure

### `/executed/`
Migrations qui ont déjà été exécutées sur la base de données de production.
Ces fichiers sont conservés pour référence historique et documentation.

**Migrations présentes** :
- `migration_schedule.sql` - Migration du système de planning
- `migration_add_schedule_to_sessions.sql` - Ajout du planning aux sessions
- `migration_student_session_comments.sql` - Système de commentaires élèves

### Migrations Actuelles
Les fichiers dans le dossier racine `migrations/` sont les migrations les plus récentes :
- `20251018_create_member_schedule.sql` - Création de la table member_schedule
- `20251018_populate_member_schedule.sql` - Population initiale des données

## 📝 Convention de Nommage

Les fichiers de migration suivent le format :
```
YYYYMMDD_description_de_la_migration.sql
```

Exemple : `20251018_create_member_schedule.sql`

## 🔄 Processus de Migration

1. **Créer une nouvelle migration** :
   - Créer un fichier avec la date du jour et une description claire
   - Placer le fichier dans le dossier racine `migrations/`

2. **Exécuter une migration** :
   - Tester d'abord en local
   - Exécuter sur l'environnement de staging
   - Puis sur la production

3. **Archiver après exécution** :
   - Une fois exécutée en production, déplacer le fichier vers `/executed/`
   - Documenter la date d'exécution dans le commit

## ⚠️ Règles Importantes

- **JAMAIS** modifier une migration déjà exécutée
- **TOUJOURS** créer une nouvelle migration pour corriger/modifier
- **TESTER** en local avant de déployer
- **DOCUMENTER** les changements dans le commit message
- **BACKUP** la base avant toute migration importante

## 📚 Ressources Additionnelles

- Documentation détaillée : [docs/migrations/MIGRATION_SCHEDULE_README.md](../docs/migrations/MIGRATION_SCHEDULE_README.md)
- Guide de création de tables : [docs/migrations/GUIDE-TABLE-CREATION.md](../docs/migrations/GUIDE-TABLE-CREATION.md)
- Scripts utilitaires : [scripts/](../scripts/)

## 🔗 Fichiers SQL dans /scripts/

Le dossier `/scripts/` contient également des fichiers SQL, mais ce sont des **scripts utilitaires** et non des migrations :
- Scripts de transformation de données
- Scripts de vérification
- Scripts de nettoyage
- Scripts de développement

Les **vraies migrations** doivent être placées dans ce dossier `/migrations/`.

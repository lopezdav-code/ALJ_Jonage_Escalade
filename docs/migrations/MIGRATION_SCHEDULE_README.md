# Migration du Planning vers la Base de Données

## Résumé des changements

Le planning est maintenant stocké en **base de données Supabase** au lieu d'un fichier CSV statique.

### Avantages :
- ✅ Les encadrants sont référencés par leur **ID** (relation avec la table `members`)
- ✅ Planning **administrable** via l'interface (futur)
- ✅ Données **dynamiques** et facilement modifiables
- ✅ Cohérence des données (si un membre change de nom, le planning est automatiquement à jour)

## 📋 Étapes de migration

### 1. Exécuter le script SQL

1. Connectez-vous à votre **interface Supabase** (https://supabase.com)
2. Allez dans **SQL Editor**
3. Copiez tout le contenu du fichier `migration_schedule.sql`
4. Exécutez le script

Le script va :
- ✅ Créer la table `schedule`
- ✅ Créer les index pour optimiser les performances
- ✅ Créer une fonction `find_member_id_by_name()` pour trouver les IDs des membres
- ✅ Insérer toutes les données du planning avec conversion automatique des noms vers les IDs
- ✅ Configurer les politiques de sécurité (RLS)
- ✅ Afficher un rapport des encadrants non trouvés

### 2. Vérifier les résultats

Après l'exécution du script, vous devriez voir :

#### Rapport de vérification
Le script affiche automatiquement :
- Les créneaux où des encadrants n'ont pas été trouvés dans la table `members`
- Le nombre total de créneaux créés
- Le nombre de créneaux avec au moins un encadrant

#### Si des encadrants sont manquants

Si certains encadrants n'ont pas été trouvés, vous avez **deux options** :

**Option A : Créer les membres manquants**
```sql
-- Ajouter les membres manquants à la table members
INSERT INTO members (first_name, last_name)
VALUES
  ('Thibault', 'N'),
  ('Edgar', 'Bénévole'),
  ('Tom', 'Bénévole'),
  -- etc.
;

-- Puis réexécuter les insertions pour ces créneaux
UPDATE schedule
SET instructor_1_id = find_member_id_by_name('Thibault N')
WHERE type = 'Perf' AND age_category = 'U13(2)-U15-U17-U19';
```

**Option B : Mettre à jour manuellement les IDs**
```sql
-- Exemple : associer un créneau à un encadrant existant
UPDATE schedule
SET instructor_1_id = 'uuid-de-l-encadrant'
WHERE id = 'uuid-du-creneau';
```

### 3. Tester l'application

1. Rechargez votre application React
2. Naviguez vers la page **Planning** (`/schedule`)
3. Vérifiez que :
   - ✅ Le planning s'affiche correctement
   - ✅ Les créneaux sont au bon emplacement
   - ✅ Les encadrants s'affichent quand on coche "Afficher les encadrants"
   - ✅ Les filtres fonctionnent (par groupe, par encadrant)

## 🗂️ Structure de la table `schedule`

```sql
CREATE TABLE schedule (
  id UUID PRIMARY KEY,
  type VARCHAR(50),              -- Compétition, Loisir, Perf, Autonomes
  age_category VARCHAR(100),     -- U11-U13, Lycéens, etc.
  day VARCHAR(20),               -- Lundi, Mardi, etc.
  start_time TIME,               -- Heure de début
  end_time TIME,                 -- Heure de fin
  instructor_1_id UUID,          -- ID du 1er encadrant (FK vers members)
  instructor_2_id UUID,          -- ID du 2ème encadrant (FK vers members)
  instructor_3_id UUID,          -- ID du 3ème encadrant (FK vers members)
  instructor_4_id UUID,          -- ID du 4ème encadrant (FK vers members)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 📝 Fichiers modifiés

### 1. `migration_schedule.sql` (nouveau)
- Script SQL complet pour la migration
- Création de la table
- Fonction de conversion nom → ID
- Insertion des données

### 2. `src/pages/Schedule.jsx` (modifié)
- ✅ Ajout du chargement depuis Supabase
- ✅ Transformation des données pour l'affichage
- ✅ Gestion du chargement avec indicateur
- ✅ Affichage des noms des encadrants (jointure automatique)

### 3. `src/data/schedule.js` (nettoyé)
- ❌ Suppression du CSV statique
- ✅ Conservation uniquement des constantes (`timeSlots`, `days`, `ageCategories`)

## 🔒 Sécurité (RLS - Row Level Security)

Les politiques configurées :
- **Lecture** : Tout le monde peut voir le planning (visiteurs, membres, admins)
- **Modification** : Seuls les **administrateurs** peuvent modifier le planning

## 🚀 Prochaines étapes (optionnel)

Pour rendre le planning complètement administrable :

1. **Créer une interface d'administration** pour :
   - Ajouter/modifier/supprimer des créneaux
   - Assigner des encadrants aux créneaux
   - Gérer les types de cours

2. **Ajouter des fonctionnalités avancées** :
   - Historique des modifications
   - Notification aux encadrants lors de changements
   - Import/export du planning
   - Vue calendrier alternative

## ❓ Aide et dépannage

### Problème : Le planning est vide
- Vérifiez que le script SQL s'est bien exécuté
- Regardez la console du navigateur pour voir les erreurs
- Vérifiez les logs Supabase

### Problème : Les encadrants n'apparaissent pas
- Vérifiez que les IDs des encadrants sont bien renseignés dans la base
- Exécutez la requête de vérification du script SQL
- Cochez "Afficher les encadrants" dans l'interface

### Problème : Erreur de permissions
- Vérifiez que les politiques RLS sont bien configurées
- Vérifiez que votre utilisateur a les bonnes permissions

## 📞 Support

En cas de problème, consultez :
- Les logs Supabase (section Logs dans le dashboard)
- La console du navigateur (F12 → Console)
- Le fichier `migration_schedule.sql` pour comprendre la structure

---

✅ Migration terminée avec succès !

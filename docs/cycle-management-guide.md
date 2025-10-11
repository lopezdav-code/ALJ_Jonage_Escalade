# Guide de Gestion des Cycles de Séances

## Vue d'ensemble

Le système de gestion des cycles permet de regrouper plusieurs séances d'escalade sous un thème ou objectif commun. Chaque cycle peut contenir de 1 à plusieurs séances.

## Structure de la base de données

### Table `cycles`
- `id` (UUID) : Identifiant unique
- `name` (VARCHAR) : Nom du cycle
- `short_description` (TEXT) : Description courte
- `long_description` (TEXT) : Description détaillée
- `created_at` (TIMESTAMP) : Date de création
- `updated_at` (TIMESTAMP) : Date de mise à jour
- `created_by` (UUID) : Créateur du cycle
- `is_active` (BOOLEAN) : Cycle actif ou archivé

### Table `sessions` (modification)
- Ajout de `cycle_id` (UUID) : Lien vers le cycle parent (optionnel)

## Gestion des droits

### Lecture (Consultation des cycles)
- ✅ Tous les utilisateurs authentifiés

### Création/Modification de cycles
- ✅ Encadrants
- ✅ Administrateurs

### Suppression (Archivage) de cycles
- ✅ Administrateurs uniquement

## Fonctionnalités

### 1. Page de gestion des cycles (`/cycles`)

**Accessible aux : Encadrants et Administrateurs**

Permet de :
- Visualiser tous les cycles actifs
- Créer un nouveau cycle
- Modifier un cycle existant
- Archiver un cycle (Admin seulement)
- Voir le nombre de séances par cycle

### 2. Page détail d'un cycle (`/cycles/:id`)

**Accessible à : Tous les utilisateurs authentifiés**

Affiche :
- Informations complètes du cycle
- Statistiques (nombre de séances, participants total, période)
- Liste de toutes les séances du cycle
- Possibilité d'ajouter/retirer des séances (Encadrants/Admin)

### 3. Intégration dans SessionLog

L'historique des séances affiche maintenant :
- Badge "Cycle" si la séance appartient à un cycle
- Information du cycle dans les détails de la séance
- Description courte du cycle si disponible

## Navigation

Le menu de navigation a été mis à jour :
```
Séances
├── Historique des séances (Adhérents, Encadrants, Admin)
├── Gestion des cycles (Encadrants, Admin) ← NOUVEAU
└── Validation Passeports (Encadrants, Admin)
```

## Installation en base de données

### Étape 1 : Créer la table cycles
```sql
-- Exécuter le script
scripts/create-cycles-table.sql
```

### Étape 2 : Ajouter la colonne cycle_id à sessions
```sql
-- Exécuter le script
scripts/add-cycle-id-to-sessions.sql
```

## Utilisation

### Créer un nouveau cycle

1. Aller sur `/cycles`
2. Cliquer sur "Nouveau Cycle"
3. Remplir :
   - Nom du cycle (obligatoire)
   - Description courte (optionnelle)
   - Description détaillée (optionnelle)
4. Cliquer sur "Créer"

### Ajouter une séance à un cycle

**Méthode 1 : Depuis le détail du cycle**
1. Ouvrir le cycle désiré
2. Cliquer sur "Ajouter une séance"
3. Sélectionner une séance existante dans la liste
4. Confirmer

**Méthode 2 : En modifiant une séance (à venir)**
Possibilité future d'assigner un cycle lors de la création/modification d'une séance.

### Retirer une séance d'un cycle

1. Ouvrir le détail du cycle
2. Trouver la séance à retirer
3. Cliquer sur l'icône de suppression (corbeille)
4. La séance n'est pas supprimée, juste dissociée du cycle

### Archiver un cycle (Admin)

1. Depuis `/cycles`
2. Cliquer sur l'icône de suppression
3. Confirmer l'archivage
4. Le cycle devient invisible mais peut être restauré

## Exemples d'utilisation

### Exemple 1 : Cycle d'initiation
```
Nom: "Initiation Bloc Octobre 2025"
Description courte: "Programme d'initiation pour débutants"
Description longue: "Cycle de 8 séances pour apprendre les bases de l'escalade en bloc..."
Séances: 8 séances du 01/10/2025 au 26/10/2025
```

### Exemple 2 : Préparation compétition
```
Nom: "Prépa Championnat Régional"
Description courte: "Entraînement intensif pré-compétition"
Description longue: "Programme de préparation physique et technique..."
Séances: 12 séances sur 6 semaines
```

## Fichiers créés/modifiés

### Nouveaux fichiers
- `scripts/create-cycles-table.sql` : Structure de la table cycles
- `scripts/add-cycle-id-to-sessions.sql` : Ajout colonne cycle_id
- `src/pages/CycleManagement.jsx` : Page de gestion des cycles
- `src/pages/CycleDetail.jsx` : Page détail d'un cycle

### Fichiers modifiés
- `src/App.jsx` : Ajout routes /cycles et /cycles/:id
- `src/components/Navigation.jsx` : Ajout menu "Gestion des cycles"
- `src/pages/AdminManagement.jsx` : Ajout config navigation cycles
- `src/pages/SessionLog.jsx` : Ajout requête cycles
- `src/components/session-log/SessionList.jsx` : Affichage cycles

## API Supabase

### Récupérer tous les cycles actifs
```javascript
const { data, error } = await supabase
  .from('cycles')
  .select('*, sessions(count)')
  .eq('is_active', true)
  .order('created_at', { ascending: false });
```

### Récupérer les séances d'un cycle
```javascript
const { data, error } = await supabase
  .from('sessions')
  .select('*, cycles(*)')
  .eq('cycle_id', cycleId)
  .order('date', { ascending: false });
```

### Associer une séance à un cycle
```javascript
const { error } = await supabase
  .from('sessions')
  .update({ cycle_id: cycleId })
  .eq('id', sessionId);
```

## Notes importantes

1. **Suppression logique** : Les cycles ne sont jamais vraiment supprimés, juste marqués comme inactifs (`is_active = false`)
2. **Séances orphelines** : Une séance peut exister sans cycle (cycle_id = null)
3. **Permissions RLS** : Les politiques de sécurité Supabase garantissent le respect des droits
4. **Performance** : Des index sont créés sur cycle_id pour optimiser les requêtes

## Améliorations futures possibles

- [ ] Sélection du cycle lors de la création d'une séance
- [ ] Statistiques avancées par cycle
- [ ] Export PDF du cycle avec toutes ses séances
- [ ] Duplication de cycle
- [ ] Templates de cycles prédéfinis
- [ ] Cycle récurrents (hebdomadaire, mensuel)

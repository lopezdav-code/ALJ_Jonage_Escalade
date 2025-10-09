# Configuration de la base de données pour la fonctionnalité Vocabulaire

## Table vocabulary_sheets

Cette fonctionnalité nécessite une nouvelle table `vocabulary_sheets` pour sauvegarder les associations entre la page Vocabulaire et les fiches pédagogiques.

### Création de la table

1. **Via l'interface Supabase** :
   - Aller dans le dashboard Supabase
   - Section "Table Editor"
   - Exécuter le script SQL : `scripts/create-vocabulary-sheets-table.sql`

2. **Via SQL Editor** :
   - Copier le contenu du fichier `scripts/create-vocabulary-sheets-table.sql`
   - Coller dans SQL Editor de Supabase
   - Exécuter le script

### Structure de la table

```sql
vocabulary_sheets (
  id SERIAL PRIMARY KEY,
  pedagogy_sheet_id INTEGER REFERENCES pedagogy_sheets(id),
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

### Fonctionnalités

- **Sauvegarde automatique** : Quand une fiche est sélectionnée, elle est automatiquement sauvegardée
- **Prévention des doublons** : Contrainte UNIQUE sur pedagogy_sheet_id
- **Suppression** : Bouton pour retirer une fiche sauvegardée
- **Interface** : Liste des fiches sauvegardées avec actions

### Sécurité (RLS - Row Level Security)

Si vous avez activé RLS sur Supabase, ajoutez ces politiques :

```sql
-- Permettre la lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow read access" ON vocabulary_sheets
FOR SELECT USING (true);

-- Permettre l'insertion pour tous les utilisateurs authentifiés
CREATE POLICY "Allow insert access" ON vocabulary_sheets
FOR INSERT WITH CHECK (true);

-- Permettre la suppression pour tous les utilisateurs authentifiés
CREATE POLICY "Allow delete access" ON vocabulary_sheets
FOR DELETE USING (true);
```

### Test de la configuration

Utilisez le script de test :
```bash
node scripts/create-vocabulary-table.js
```

### Troubleshooting

Si vous rencontrez des erreurs :

1. **Table already exists** : Normal, la table existe déjà
2. **Permission denied** : Vérifiez les politiques RLS
3. **Foreign key constraint** : Assurez-vous que la table `pedagogy_sheets` existe
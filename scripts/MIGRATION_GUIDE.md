# Guide de migration - Gestion des numéros de dossard par horaire

## Résumé des changements

Ce guide couvre les modifications pour assigner les numéros de dossard en fonction de l'horaire de la compétition:

- **MATIN** (Dimanche Matin Enfants U9-U11-U13): numéros **1-500**
- **APRÈS-MIDI** (Après-midi U15-U17-U19): numéros **501-999**
- **BUVETTE**: Aucun numéro de dossard

## Fichiers de migration

Deux scripts SQL doivent être exécutés dans cet ordre:

1. **`add-horaire-and-type-inscription-columns.sql`** - Ajoute les colonnes nécessaires
2. **`update-dossard-assignment-logic.sql`** - Met à jour la fonction d'assignation des dossards

## Instructions d'exécution

### Étape 1: Ajouter les colonnes

1. Ouvrez **Supabase Dashboard** → **SQL Editor**
2. Ouvrez le fichier `scripts/add-horaire-and-type-inscription-columns.sql`
3. Copiez et exécutez le contenu de la première partie (jusqu'à "Étape 2")
4. Vérifiez que les colonnes `horaire` et `type_inscription` existent

### Étape 2: Mettre à jour les données existantes

1. Toujours dans le SQL Editor
2. Exécutez la partie "Étape 2" du script pour mettre à jour les données

### Étape 3: Remplacer la fonction d'assignation

1. Ouvrez le fichier `scripts/update-dossard-assignment-logic.sql`
2. Copiez et exécutez la première partie (création de la fonction)

### Étape 4 (Optionnel): Réassigner les dossards existants

Si vous avez déjà des inscriptions avec des numéros de dossard assignés de manière incorrecte:

```sql
-- Réinitialiser les numéros de dossard
UPDATE competition_registrations
SET numero_dossart = NULL
WHERE horaire IS NOT NULL;

-- Réassigner les numéros selon la nouvelle logique
SELECT assign_dossard_numbers();
```

⚠️ **ATTENTION**: Cette opération supprime tous les numéros de dossard existants et les réassigne.

## Vérification

Pour vérifier que la migration s'est bien déroulée, exécutez:

```sql
-- Voir la distribution des numéros par horaire
SELECT
  horaire,
  type_inscription,
  COUNT(*) as total,
  MIN(numero_dossart) as min_dossart,
  MAX(numero_dossart) as max_dossart
FROM competition_registrations
WHERE numero_dossart IS NOT NULL
GROUP BY horaire, type_inscription
ORDER BY horaire, type_inscription;
```

**Résultat attendu:**
| horaire | type_inscription | total | min_dossart | max_dossart |
|---------|------------------|-------|-------------|-------------|
| matin | Compétition | X | 1 | ≤500 |
| après-midi | Compétition | Y | 501 | ≤999 |
| (null) | Buvette | Z | (null) | (null) |

## Impact sur l'interface

Après l'application de ces changements:

✅ Les nouveaux imports Excel assigneront automatiquement les numéros de dossard en fonction de l'horaire
✅ La colonne "Tarif" sera masquée dans l'interface
✅ Les colonnes "Horaire" et "Type d'inscription" seront visibles
✅ Les filtres par horaire et type d'inscription seront disponibles

## Dépannage

### Erreur: "Trop de participants pour le matin (max 500)"

Si vous recevez cette erreur lors de l'import, cela signifie que vous avez plus de 500 participants pour le matin. Options:

1. Vérifier les données d'import
2. Augmenter les limites dans la fonction SQL:
   ```sql
   next_matin INTEGER := 1;        -- Changer la limite supérieure
   ```

### Les numéros de dossard ne sont pas assignés

Vérifiez que:
- Les colonnes `horaire` et `type_inscription` existent
- La fonction `assign_dossard_numbers()` a été correctement créée
- Les données ont des valeurs correctes dans la colonne `horaire`

```sql
-- Vérifier que la fonction existe
\df assign_dossard_numbers

-- Vérifier les données
SELECT
  id,
  nom_participant,
  horaire,
  type_inscription,
  numero_dossart
FROM competition_registrations
LIMIT 10;
```

## Rollback

Si vous devez revenir à l'ancienne logique:

```sql
-- Réintroduire l'ancienne fonction
CREATE OR REPLACE FUNCTION assign_dossard_numbers()
RETURNS void AS $$
DECLARE
  next_number INTEGER := 1;
  reg RECORD;
BEGIN
  FOR reg IN
    SELECT id
    FROM competition_registrations
    WHERE numero_dossart IS NULL
    ORDER BY created_at, id
  LOOP
    WHILE EXISTS (SELECT 1 FROM competition_registrations WHERE numero_dossart = next_number) LOOP
      next_number := next_number + 1;
    END LOOP;

    UPDATE competition_registrations
    SET numero_dossart = next_number
    WHERE id = reg.id;

    next_number := next_number + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

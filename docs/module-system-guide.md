# Système de Validation par Module - Passeports d'Escalade

## 📋 Vue d'ensemble

Le système de passeports a été restructuré pour permettre la validation séparée des **modules Bloc** et **Difficulté**, reflétant la réalité des deux types de salles d'escalade.

## 🎯 Objectifs

- **Séparer les contextes** : Bloc (salle de bloc) vs Difficulté (salle avec cordes)
- **Validation progressive** : Un grimpeur peut valider les modules indépendamment
- **Traçabilité** : Enregistrer quel module a été validé et quand
- **Flexibilité** : Adapter la validation au contexte de pratique réel

## 🧗 Modules disponibles

### Module Bloc
**Lieu** : Salle de bloc, pan, blocs naturels

**Passeport Blanc :**
- 9 compétences spécifiques au bloc
- Niveau : Blocs faciles de niveau 3
- Validation : Test final ou contrôle continu

**Passeport Jaune :**
- 13 compétences spécifiques au bloc
- Niveau : Blocs faciles de niveau 4a
- Validation : Test final ou contrôle continu

### Module Difficulté
**Lieu** : SAE à corde, site découverte

**Passeport Blanc :**
- 5 compétences en moulinette
- Niveau : 3 voies sur 4 de niveau 4b
- Validation : Test final

**Passeport Jaune :**
- 7 compétences en tête
- Niveau : 3 voies sur 4 de niveau 5b (pas forcément à vue)
- Validation : Test final

### Modules communs (tous deux)
- **Module éco-responsabilité** : Comportement et respect (6 compétences pour Blanc, 4 pour Jaune)
- **Module sécurité** : Techniques de sécurité (19 compétences pour Blanc, 11 pour Jaune)

## 💾 Structure de la base de données

### Colonne ajoutée : `module`

```sql
ALTER TABLE passeport_validations
ADD COLUMN module VARCHAR(20);
```

**Valeurs possibles :**
- `'bloc'` : Validation du module Bloc
- `'difficulte'` : Validation du module Difficulté
- `NULL` : Anciennes validations (avant la séparation par module)

**Contrainte :**
```sql
CHECK (module IN ('bloc', 'difficulte', NULL))
```

### Index créés

1. **idx_passeport_validations_module** : Recherche par module
2. **idx_passeport_validations_member_niveau_module** : Recherche combinée (membre + niveau + module)

## 🎨 Interface utilisateur

### Sélection du module

L'utilisateur doit d'abord sélectionner le module à valider :

```
┌─────────────────────────────────────────┐
│  🧗 Module Bloc                         │
│     Salle de bloc                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🧗‍♀️ Module Difficulté                  │
│     Salle d'escalade à cordes           │
└─────────────────────────────────────────┘
```

### Affichage conditionnel

- **Avant sélection** : Seules les informations du grimpeur sont visibles
- **Après sélection** : 
  - Barre de progression du module
  - Compétences du module sélectionné
  - Modules communs (éco-responsabilité, sécurité)
  - Validation finale

### Progression par module

```
Progression - Module Bloc
12 / 28 compétences validées
[████████████░░░░░░░░░░░░░░░░] 43%
```

## 📊 Exemples de requêtes

### Récupérer toutes les validations d'un membre

```sql
SELECT 
  niveau,
  module,
  date_validation,
  validateur,
  competences_validees
FROM passeport_validations
WHERE member_id = 'xxx-xxx-xxx'
ORDER BY date_validation DESC;
```

### Vérifier si un membre a validé un module spécifique

```sql
SELECT EXISTS (
  SELECT 1
  FROM passeport_validations
  WHERE member_id = 'xxx-xxx-xxx'
    AND niveau = 'blanc'
    AND module = 'bloc'
) AS a_valide_bloc_blanc;
```

### Statistiques par module

```sql
SELECT 
  niveau,
  module,
  COUNT(*) as nombre_validations
FROM passeport_validations
WHERE module IS NOT NULL
GROUP BY niveau, module
ORDER BY niveau, module;
```

## 🔄 Migration des données existantes

Les validations existantes (avant la séparation par module) :
- Ont `module = NULL`
- Restent valides et consultables
- Peuvent être complétées par de nouvelles validations avec module spécifié

**Stratégie recommandée :**
- Conserver les anciennes validations
- Les nouvelles validations spécifient toujours le module
- Affichage : Grouper par niveau puis par module

## ✅ Validation complète d'un passeport

Pour obtenir un passeport complet, un grimpeur doit valider :
- ✅ Module Bloc
- ✅ Module Difficulté
- ✅ Modules communs (inclus dans les deux)

**Exemple pour Passeport Blanc :**
```
Module Bloc (28 compétences) : ✓
Module Difficulté (24 compétences) : ✓
Total : 39 compétences validées (avec 13 communes)
```

## 🎓 Avantages du système

1. **Réalisme** : Correspond aux différents types de salles
2. **Flexibilité** : Validation progressive selon disponibilité des structures
3. **Motivation** : Objectifs intermédiaires plus accessibles
4. **Traçabilité** : Historique précis des validations par module
5. **Adaptabilité** : Facilite l'organisation des sessions de validation

## 📝 Notes importantes

- Un grimpeur peut valider les modules dans n'importe quel ordre
- Les modules communs (éco-responsabilité, sécurité) doivent être validés pour chaque module
- Le validateur peut être différent pour chaque module
- La date de validation est enregistrée séparément pour chaque module

## 🚀 Prochaines étapes

1. ✅ Ajouter la colonne `module` à la BDD
2. ✅ Modifier les formulaires de validation
3. ✅ Adapter l'affichage de l'historique
4. ⏳ Mettre à jour PasseportViewer pour afficher les modules
5. ⏳ Créer des statistiques par module
6. ⏳ Générer des certificats par module ou passeport complet

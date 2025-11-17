# Gestion de Compétition - Documentation

## Vue d'ensemble

La page **Gestion de Compétition** permet d'importer des inscriptions depuis un fichier Excel, de gérer les numéros de dossards et d'imprimer des feuilles de score au format PDF pour les participants.

## Accès

- **URL** : `/competition-management`
- **Accès** : Administrateurs uniquement
- **Lien** : Disponible dans le tableau de bord administration

## Installation et Configuration

### 1. Créer la table dans Supabase

Connectez-vous à votre projet Supabase et exécutez le script SQL suivant dans l'éditeur SQL :

```sql
-- Voir le fichier : sql/create_competition_registrations.sql
```

Le script crée :
- La table `competition_registrations` avec toutes les colonnes nécessaires
- Des index pour améliorer les performances de recherche
- Un trigger pour mettre à jour automatiquement `updated_at`
- Une fonction `assign_dossard_numbers()` pour assigner automatiquement les numéros de dossards de manière incrémentale

### 2. Activer RLS (Row Level Security)

Si vous utilisez RLS dans Supabase, ajoutez ces politiques :

```sql
-- Autoriser les admins à lire
CREATE POLICY "Admins can read competition_registrations"
ON competition_registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Autoriser les admins à insérer
CREATE POLICY "Admins can insert competition_registrations"
ON competition_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Autoriser les admins à mettre à jour
CREATE POLICY "Admins can update competition_registrations"
ON competition_registrations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Autoriser les admins à supprimer
CREATE POLICY "Admins can delete competition_registrations"
ON competition_registrations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

### 3. Vérifier les dépendances

Les packages suivants ont été installés :
- `xlsx` : Pour lire les fichiers Excel
- `jspdf` : Pour générer des PDF

Vérifiez qu'ils sont bien présents dans `package.json`.

## Format du fichier Excel

### Colonnes requises

Le fichier Excel doit contenir les colonnes suivantes (l'ordre n'est pas important) :

| Colonne | Type | Obligatoire | Description |
|---------|------|-------------|-------------|
| Référence commande | Texte | Non | Référence unique de la commande |
| Date de la commande | Date/Texte | Non | Format: DD/MM/YYYY HH:MM |
| Statut de la commande | Texte | Non | Ex: Validé, En attente |
| Nom participant | Texte | **Oui** | Nom de famille du participant |
| Prénom participant | Texte | **Oui** | Prénom du participant |
| Nom payeur | Texte | Non | Nom de famille du payeur |
| Prénom payeur | Texte | Non | Prénom du payeur |
| Email payeur | Texte | Non | Email du payeur |
| Raison sociale | Texte | Non | Raison sociale si applicable |
| Moyen de paiement | Texte | Non | Ex: Carte bancaire, Chèque |
| Billet | Texte | Non | Type de billet |
| Numéro de billet | Texte | Non | Identifiant unique du billet |
| Tarif | Texte | Non | Description du tarif |
| Montant tarif | Nombre | Non | Montant en euros |
| Code Promo | Texte | Non | Code promo utilisé |
| Montant code promo | Nombre | Non | Réduction en euros |
| Date de naissance | Date/Texte | Non | Format: DD/MM/YYYY |
| Club | Texte | Non | Nom du club |
| Numéro de licence FFME | Texte | Non | Numéro de licence |

### Exemple de fichier Excel

```
Référence commande | Date de la commande | Statut de la commande | Nom participant | Prénom participant | ... | Date de naissance | Club | Numéro de licence FFME
158641041 | 16/11/2025 21:34 | Validé | Serre | Matthieu | ... | 29/09/2008 | Corb'Alp | 717284
```

## Fonctionnalités

### 1. Import de fichier Excel

1. Cliquez sur la zone d'upload "Cliquez pour uploader un fichier Excel"
2. Sélectionnez votre fichier `.xlsx` ou `.xls`
3. L'import se lance automatiquement
4. Les numéros de dossards sont assignés automatiquement de manière incrémentale
5. Un message de succès confirme le nombre d'inscriptions importées

### 2. Recherche multi-critères

La barre de recherche permet de filtrer par :
- Nom du participant
- Prénom du participant
- Club
- Numéro de licence FFME
- Référence de commande
- Tarif

### 3. Filtres d'impression

Filtrez les inscriptions par statut d'impression :
- **Tous** : Affiche toutes les inscriptions
- **Imprimés** : Affiche uniquement les dossards déjà imprimés
- **Non imprimés** : Affiche uniquement les dossards en attente d'impression

### 4. Sélection multiple

- Cochez la case dans l'en-tête du tableau pour sélectionner toutes les inscriptions visibles
- Cochez les cases individuelles pour sélectionner des inscriptions spécifiques
- Le nombre d'inscriptions sélectionnées s'affiche en haut du tableau

### 5. Génération de PDF

1. Sélectionnez les inscriptions à imprimer
2. Cliquez sur le bouton "Générer PDF"
3. Un PDF est téléchargé contenant une feuille de score par participant
4. Les inscriptions sont automatiquement marquées comme "Déjà imprimée"

### Contenu de la feuille de score PDF

Chaque feuille de score contient :
- **Informations du participant** :
  - Nom
  - Prénom
  - Homme / Femme (à compléter manuellement pour l'instant)
  - Club
  - Catégorie (calculée automatiquement selon l'âge : U13, U15, U17, U19, Sénior, Vétéran)

- **Tableau de scoring** :
  - Niveaux de difficulté de 4a à 8a+
  - Points pour les grimpeurs ALJ
  - Points pour les grimpeurs extérieurs
  - Lignes pour marquer : 1 fois Topée, 2 fois Topée, 3 fois Topée

- **Consignes** :
  - Cocher une case du niveau de difficulté pour chaque voie différente réalisée
  - Pour les U15 et plus, pas de différence entre les voies faites en moulinette ou en tête

### 6. Réinitialisation

Le bouton "Réinitialiser" permet de supprimer **TOUTES** les inscriptions de la base de données.

⚠️ **Attention** : Cette action est irréversible ! Une confirmation est demandée avant de procéder.

## Statistiques

Le tableau de bord affiche :
- **Inscriptions totales** : Nombre total d'inscriptions dans la base
- **Dossards imprimés** : Nombre d'inscriptions avec un dossard déjà imprimé
- **En attente d'impression** : Nombre d'inscriptions dont le dossard n'a pas encore été imprimé

## Numéros de dossards

Les numéros de dossards sont assignés automatiquement :
- Commence à 1
- Incrémente de manière séquentielle
- S'assigne lors de l'import du fichier Excel
- Reste fixe même après suppression d'autres inscriptions (pas de réassignation)

## Gestion des erreurs

### Erreur d'import Excel

Si l'import échoue, vérifiez :
1. Le format du fichier (`.xlsx` ou `.xls`)
2. Les noms des colonnes (doivent correspondre exactement)
3. La première ligne doit contenir les en-têtes
4. Le format des dates (DD/MM/YYYY)

### Fonction assign_dossard_numbers non trouvée

Si vous obtenez cette erreur, assurez-vous d'avoir exécuté le script SQL complet qui crée la fonction.

## Améliorations futures possibles

1. **Détection automatique du sexe** : Ajouter une colonne "Sexe" dans le fichier Excel
2. **Catégories personnalisées** : Permettre de définir des catégories d'âge personnalisées
3. **Export Excel** : Exporter les inscriptions vers Excel
4. **Édition manuelle** : Modifier les inscriptions directement dans l'interface
5. **Photos** : Ajouter des photos de participants sur les dossards
6. **QR Code** : Générer des QR codes pour le suivi des participants
7. **Statistiques avancées** : Graphiques par club, par catégorie, etc.

## Support

Pour toute question ou problème :
1. Vérifiez que le script SQL a bien été exécuté dans Supabase
2. Vérifiez les permissions d'accès (admin uniquement)
3. Consultez la console du navigateur pour les erreurs JavaScript
4. Vérifiez les logs Supabase pour les erreurs de base de données

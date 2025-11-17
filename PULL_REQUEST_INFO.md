# Pull Request - Gestion de Compétition

## 🔗 Lien pour créer la Pull Request

**Cliquez sur ce lien pour créer la PR sur GitHub :**

```
https://github.com/lopezdav-code/ALJ_Jonage_Escalade/compare/main...claude/competition-management-page-01U15dkjaWyk2xHMjZe7doCY
```

## 📝 Titre de la PR

```
Ajout de la page de gestion de compétition avec import Excel et génération PDF
```

## 📋 Description de la PR

Copiez-collez le texte suivant dans la description :

---

## 🎯 Objectif

Ajouter une nouvelle page dans le tableau de bord admin permettant de gérer les inscriptions à une compétition depuis un fichier Excel et de générer des feuilles de score PDF pour les dossards.

## ✨ Fonctionnalités ajoutées

### 1. Import de fichier Excel
- Upload de fichier `.xlsx` ou `.xls`
- Parsing automatique des colonnes (référence, nom, prénom, club, licence, etc.)
- Conversion automatique des dates (DD/MM/YYYY)
- Import en base de données

### 2. Gestion des dossards
- Attribution automatique de numéros de dossards incrémentaux
- Marquage des dossards imprimés/non imprimés
- Statistiques en temps réel

### 3. Recherche et filtrage
- Recherche multi-critères (nom, prénom, club, licence, référence, tarif)
- Filtres par statut d'impression (Tous / Imprimés / Non imprimés)

### 4. Génération de PDF
- Sélection multiple de participants
- Génération de feuilles de score individuelles
- Contenu PDF :
  - Informations participant (nom, prénom, club, catégorie)
  - Tableau des difficultés (4a à 8a+)
  - Barème de points (ALJ et Extérieur)
  - Lignes pour marquer les voies (1x, 2x, 3x Topée)
  - Consignes de remplissage
- Marquage automatique comme "imprimé"

### 5. Catégories d'âge automatiques
Calcul automatique basé sur la date de naissance :
- U13 (< 13 ans)
- U15 (13-14 ans)
- U17 (15-16 ans)
- U19 (17-18 ans)
- Sénior (19-39 ans)
- Vétéran (40+ ans)

## 📁 Fichiers créés

- `sql/create_competition_registrations.sql` - Table et fonctions SQL
- `src/pages/CompetitionManagement.jsx` - Page React complète
- `COMPETITION_MANAGEMENT_README.md` - Documentation utilisateur

## 📝 Fichiers modifiés

- `src/App.jsx` - Ajout de la route `/competition-management`
- `src/pages/AdminDashboard.jsx` - Ajout du lien dans le dashboard
- `package.json` - Dépendances xlsx et jspdf

## 🗄️ Base de données

### Table créée : `competition_registrations`
Colonnes principales :
- Informations commande (référence, date, statut)
- Participant (nom, prénom, date de naissance, club, licence)
- Payeur (nom, prénom, email, raison sociale)
- Paiement (moyen, tarif, montant, code promo)
- Dossard (`numero_dossart` auto-incrémental, `deja_imprimee` booléen)

### Fonction SQL : `assign_dossard_numbers()`
Assigne automatiquement les numéros de dossards de manière séquentielle.

## 📦 Dépendances ajoutées

- `xlsx` (v0.18.5) - Lecture de fichiers Excel
- `jspdf` (v3.0.3) - Génération de PDF

## 🔐 Sécurité

- Accès réservé aux administrateurs uniquement
- Route protégée via `ProtectedRoute`
- Validation des données importées

## 📋 Prochaines étapes pour utilisation

1. **Exécuter le script SQL** dans Supabase :
   ```sql
   -- Voir le contenu de sql/create_competition_registrations.sql
   ```

2. **Activer RLS** (si nécessaire) - Voir `COMPETITION_MANAGEMENT_README.md`

3. **Tester l'import** avec un fichier Excel au format attendu

## 📖 Format Excel attendu

Colonnes requises (avec ou sans accents) :
- Référence commande
- Date de la commande
- Statut de la commande
- **Nom participant** (obligatoire)
- **Prénom participant** (obligatoire)
- Nom payeur, Prénom payeur, Email payeur
- Raison sociale
- Moyen de paiement
- Billet, Numéro de billet
- Tarif, Montant tarif
- Code Promo, Montant code promo
- Date de naissance
- Club
- Numéro de licence FFME

## 🧪 Tests recommandés

- [ ] Upload d'un fichier Excel valide
- [ ] Recherche et filtrage des inscriptions
- [ ] Sélection multiple de participants
- [ ] Génération PDF avec plusieurs participants
- [ ] Vérification du marquage "déjà imprimé"
- [ ] Reset de la table

## 📚 Documentation

Documentation complète disponible dans `COMPETITION_MANAGEMENT_README.md`

## 🎨 Interface utilisateur

- Design cohérent avec le reste de l'application
- Utilisation des composants UI existants (shadcn/ui)
- Animations Framer Motion
- Responsive design
- Statistiques visuelles (cartes avec compteurs)
- Filtres intuitifs

## ⚡ Performance

- Import optimisé avec `xlsx`
- Génération PDF rapide avec `jspdf`
- Index SQL pour recherches rapides
- Lazy loading de la page (code splitting)

---

**Route** : `/competition-management` (Admin uniquement)

**Lien dans l'app** : Tableau de bord Admin → 🏆 Gestion de Compétition

---

## 📊 Résumé des changements

- **7 fichiers modifiés**
- **1402 insertions**, **258 suppressions**
- **3 nouveaux fichiers** créés
- **2 dépendances** ajoutées

---


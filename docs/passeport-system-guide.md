# Système de Validation des Passeports d'Escalade

Ce système permet de valider et suivre les passeports d'escalade des membres du club selon le référentiel de la FFME.

## Types de Passeports

### 🟢 Passeport Blanc
**Objectif :** Grimper en moulinette de façon autonome sur SAE

**Compétences validées (15) :**
1. S'équiper pour grimper
   - Choisir des chaussons adaptés
   - Enfiler son baudrier correctement
   - Faire un nœud de huit

2. Assurer en sécurité
   - Contrôler son partenaire de cordée
   - Assurer en moulinette
   - Descendre le grimpeur en sécurité

3. Grimper en tête sur SAE
   - Grimper des voies variées
   - Utiliser différentes techniques
   - Gérer son effort

4. Lire une voie d'escalade
   - Observer et analyser
   - Identifier les prises et mouvements
   - Anticiper les difficultés

5. Être autonome sur SAE
   - Préparer et ranger la corde
   - Ranger le matériel
   - Respecter les règles de sécurité

### 🟡 Passeport Jaune
**Objectif :** Grimper en tête sur structure artificielle d'escalade

**Compétences validées (24) :**
1. S'équiper et préparer sa grimpe en tête
   - Choisir des chaussons adaptés
   - Enfiler et régler son baudrier
   - Faire un nœud de huit avec vérification
   - Contrôler son partenaire
   - Préparer et positionner ses dégaines

2. Grimper en tête sur SAE
   - Clipper la corde dans une dégaine
   - Grimper avec fluidité
   - Gérer la corde pendant l'ascension
   - Anticiper les points de repos et clippages
   - Gérer son stress et sa peur de chute

3. Assurer un grimpeur en tête
   - Assurer de manière dynamique
   - Donner et reprendre du mou
   - Parer une chute en début de voie
   - Ravaler la corde efficacement
   - Faire descendre le grimpeur en sécurité

4. Lire et analyser une voie
   - Identifier les sections difficiles
   - Planifier les séquences de mouvements
   - Évaluer les risques de chute
   - Adapter sa stratégie pendant la grimpe

5. Connaître les règles de sécurité
   - Connaître les nœuds de sécurité
   - Vérifier l'état du matériel
   - Communiquer clairement avec son partenaire
   - Respecter les autres grimpeurs
   - Savoir réagir en cas d'incident

### 🟠 Passeport Orange
**Objectif :** Grimper en tête en falaise école

**Compétences validées (30) :**
1. Préparer une sortie en falaise école
   - Choisir un site adapté à son niveau
   - Vérifier les conditions météorologiques
   - Préparer le matériel nécessaire
   - Évaluer le niveau de difficulté des voies
   - Planifier l'horaire et l'organisation

2. S'équiper pour grimper en falaise
   - Choisir l'équipement adapté
   - Contrôler l'état du matériel
   - Enfiler correctement baudrier et casque
   - Faire son encordement
   - Préparer ses dégaines et matériel de relais

3. Grimper en tête en falaise école
   - Grimper en tête sur voie équipée
   - Clipper correctement dans les dégaines
   - Gérer sa corde (éviter frottements, tirage)
   - Évaluer et choisir son itinéraire
   - Gérer son effort et ses points de repos

4. Assurer un grimpeur en falaise
   - Assurer un grimpeur en tête
   - Gérer le mou de corde
   - Parer une éventuelle chute
   - Installer un relais en tête de voie
   - Connaître les techniques de mouflage et secours de base

5. Installer et vérifier un relais
   - Choisir un bon emplacement de relais
   - Installer des anneaux de sangle ou utiliser les points en place
   - Réaliser une triangulation correcte
   - Vérifier la solidité du relais
   - Communiquer clairement lors de l'installation

6. Connaître la réglementation et l'environnement
   - Respecter la réglementation locale
   - Connaître les voies d'accès et parkings
   - Préserver l'environnement naturel
   - Gérer ses déchets
   - Respecter les autres usagers du site

### 🔴 Passeport Rouge *(à venir)*
**Objectif :** Grimper en autonomie sur tous terrains

## Utilisation du Système

### Pour les Administrateurs

#### 1. Accéder à la page de validation
- Connectez-vous en tant qu'administrateur
- Cliquez sur **"Passeports"** dans le menu de navigation
- Vous accédez à `/passeport-validation`

#### 2. Sélectionner un membre
- Utilisez le menu déroulant pour choisir un membre à évaluer
- Les membres sont triés par nom de famille
- Le passeport actuel du membre est affiché s'il en possède un

#### 3. Choisir le type de passeport
- Sélectionnez le type de passeport à valider :
  - **Blanc** : Moulinette autonome (15 compétences)
  - **Jaune** : Grimpe en tête SAE (24 compétences)
  - **Orange** : Grimpe en tête falaise école (30 compétences)
  - Rouge (à venir)

#### 4. Remplir le formulaire de validation
- **Informations du grimpeur** : Pré-remplies depuis la fiche membre
- **Compétences** : Cochez chaque compétence validée
  - La barre de progression s'actualise en temps réel
  - Toutes les compétences doivent être validées
- **Date de validation** : Date officielle de l'obtention du passeport
- **Validateur** : Nom de l'initiateur/moniteur
- **Observations** : Commentaires sur la performance, axes de progrès (optionnel)

#### 5. Valider le passeport
- Le bouton de validation est actif uniquement si toutes les compétences sont cochées
- Une fois validé :
  - L'entrée est enregistrée dans la table `passeport_validations`
  - Le champ `passeport` du membre est mis à jour
  - Un toast de confirmation s'affiche

### Pour les Membres

#### Visualiser son historique de passeports
L'historique des passeports peut être affiché dans la fiche détaillée du membre avec le composant `PasseportHistory` :

```jsx
import PasseportHistory from '@/components/PasseportHistory';

<PasseportHistory memberId={member.id} />
```

## Base de Données

### Table `passeport_validations`

```sql
CREATE TABLE passeport_validations (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES members(id),
  passeport_type TEXT CHECK (passeport_type IN ('blanc', 'jaune', 'orange', 'rouge')),
  competences JSONB,
  date_validation DATE,
  validateur TEXT,
  observations TEXT,
  validated_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Colonnes :
- **id** : Identifiant unique de la validation
- **member_id** : Référence au membre ayant obtenu le passeport
- **passeport_type** : Type de passeport (blanc, jaune, orange, rouge)
- **competences** : Objet JSON contenant toutes les compétences validées
- **date_validation** : Date officielle de validation
- **validateur** : Nom de l'initiateur/moniteur
- **observations** : Remarques sur la performance
- **validated_at** : Timestamp de l'enregistrement
- **created_at** : Date de création de l'enregistrement
- **updated_at** : Date de dernière modification

### Installation de la table

Exécutez le script SQL :
```bash
psql -U postgres -d votre_base < scripts/create-passeport-validations-table.sql
```

Ou directement dans Supabase SQL Editor :
1. Allez dans **SQL Editor**
2. Collez le contenu de `scripts/create-passeport-validations-table.sql`
3. Cliquez sur **Run**

## Structure des Fichiers

```
src/
├── components/
│   ├── PasseportBlancForm.jsx      # Formulaire de validation Blanc (15 compétences)
│   ├── PasseportJauneForm.jsx      # Formulaire de validation Jaune (24 compétences)
│   ├── PasseportOrangeForm.jsx     # Formulaire de validation Orange (30 compétences)
│   └── PasseportHistory.jsx        # Historique des passeports d'un membre
├── pages/
│   └── PasseportValidation.jsx     # Page principale de validation
└── scripts/
    └── create-passeport-validations-table.sql  # Script de création de table
```

## Fonctionnalités

✅ **Validation interactive** : Interface utilisateur intuitive avec progression en temps réel
✅ **Historique complet** : Conservation de toutes les validations avec détails
✅ **Traçabilité** : Enregistrement du validateur et de la date
✅ **Observations** : Possibilité d'ajouter des commentaires pédagogiques
✅ **Mise à jour automatique** : Le passeport du membre est automatiquement mis à jour
✅ **Design responsive** : Adapté à tous les écrans
✅ **Validation stricte** : Impossible de valider sans toutes les compétences

## Améliorations Futures

- [ ] Passeport Rouge (autonomie complète)
- [ ] Export PDF des passeports validés
- [ ] Statistiques de validation par période
- [ ] Notifications par email lors de la validation
- [ ] Système de renouvellement/recyclage
- [ ] Interface de révision des compétences
- [ ] Galerie de photos de réalisations
- [ ] Carnet de voies grimpées en falaise

## Support

Pour toute question ou problème, contactez l'équipe de développement du club.

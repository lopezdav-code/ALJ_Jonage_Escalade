# Génération d'Affiche par IA - Guide d'Implémentation

## Vue d'ensemble

Cette fonctionnalité permet de générer des affiches pour les compétitions via un workflow n8n basé sur l'IA. Elle offre deux types d'affiches :
- **Solo** : Une seule athlète en vedette
- **Groupée** : Plusieurs athlètes classés

## Architecture

### Composants

#### 1. **GeneratePosterDialog** (`src/components/GeneratePosterDialog.jsx`)
- Composant modal pour la sélection des paramètres
- Permet de choisir :
  - Type d'affiche (solo/groupée)
  - Photo de la compétition
  - Athlète(s) avec leur classement
- Validation des données avant envoi

#### 2. **n8nService** (`src/services/n8nService.js`)
- Service pour appeler le webhook n8n
- Validation du payload avant envoi
- Gestion des erreurs

#### 3. **Configuration n8n** (`src/config/n8n.js`)
- Configuration centralisée de l'URL du webhook
- Support des variables d'environnement

### Flux de données

```
Page CompetitionDetail
    ↓
Clic sur "Générer affiche par IA"
    ↓
Dialog s'ouvre avec options
    ↓
Utilisateur sélectionne les options
    ↓
POST vers n8n Webhook
    ↓
n8n génère l'affiche via IA
    ↓
Retour de l'URL de l'affiche
    ↓
Sauvegarde dans Supabase (ai_poster_url)
    ↓
Affichage confirmation
```

## Configuration

### 1. Variable d'environnement (optionnel)

Dans votre fichier `.env` ou `.env.local` :

```bash
VITE_N8N_WEBHOOK_URL=https://votre-url-n8n/webhook-xxxx
```

### 2. URL n8n par défaut

Si aucune variable d'environnement n'est définie, l'URL par défaut utilisée est :
```
https://lopez-dav.app.n8n.cloud/webhook-test/81ca48c4-0a51-466e-878d-d38f5225a339
```

### 3. Mise en base de données

Migration SQL appliquée : `20251218_add_ai_poster_url.sql`

Ajoute la colonne `ai_poster_url` à la table `competitions` :
```sql
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS ai_poster_url text;
```

## Format du JSON envoyé à n8n

### POST Request Body

```json
{
  "posterType": "solo|grouped",
  "competitionName": "Nom de la compétition",
  "competitionDate": "18/12/25",
  "photoUrl": "https://...",
  "athletes": [
    {
      "name": "Nom Athlète 1",
      "rank": 1
    },
    {
      "name": "Nom Athlète 2",
      "rank": 2
    }
  ]
}
```

### Expected Response

```json
{
  "posterUrl": "https://...",
  "status": "success",
  "message": "Affiche générée avec succès"
}
```

## Utilisation sur la page CompetitionDetail

Le bouton "Générer affiche par IA" est disponible dans la barre d'actions :

```jsx
<Button
  onClick={() => setIsGeneratePosterOpen(true)}
  variant="outline"
  className="flex items-center gap-2"
  title="Générer une affiche par IA"
>
  <Zap className="w-4 h-4" />
  Générer affiche par IA
</Button>
```

## Règles de validation

### Pour les affiches SOLO :
- ✓ Exactement 1 athlète sélectionné
- ✓ Une photo requise
- ✓ Nom de compétition requis
- ✓ Date requise

### Pour les affiches GROUPÉES :
- ✓ Au minimum 2 athlètes sélectionnés
- ✓ Une photo requise
- ✓ Nom de compétition requis
- ✓ Date requise

## Gestion des erreurs

### Validation côté client
- Messages d'erreur clairs pour chaque champ manquant
- Bouton "Générer" désactivé jusqu'à completion des champs requis

### Appel à n8n
- Toast de notification en cas d'erreur
- Affichage du message d'erreur détaillé
- Support du retry (configurable dans `src/config/n8n.js`)

### Sauvegarde Supabase
- Feedback utilisateur en cas de succès
- Gestion des erreurs de sauvegarde

## Athlètes affichés

- Maximum 20 athlètes avec classement affichés
- Triés par classement (rang) ascendant
- Affichage du format : "1. Nom Athlète (Rang: 1)"
- Limité à 10 pour les affiches solo
- Pas de limite pour les groupées (max 20)

## Extension future

Pour adapter le webhook n8n à votre instance :

1. Remplacer l'URL dans `.env` ou dans `src/config/n8n.js`
2. Adapter le payload JSON selon votre workflow n8n
3. Modifier la réponse attendue si nécessaire

## Notes importantes

- L'URL de l'affiche générée est stockée dans `competitions.ai_poster_url`
- La photo de la compétition doit être une URL accessible
- La date est formatée au format court français (JJ/MM/AA)
- Les athlètes doivent avoir un classement (rank) défini

# Implémentation - Génération d'Affiche par IA

## Date : 18 Décembre 2025

## Résumé des modifications

Cette implémentation ajoute la capacité de générer des affiches pour les compétitions via un workflow n8n basé sur l'IA, intégré à la page de détail des compétitions.

## Fichiers créés

### 1. **Service n8n** 
- `src/services/n8nService.js`
  - Service pour appeler le webhook n8n
  - Validation du payload
  - Gestion des erreurs

### 2. **Configuration**
- `src/config/n8n.js`
  - Configuration centralisée de l'URL n8n
  - Support des variables d'environnement (`VITE_N8N_WEBHOOK_URL`)

### 3. **Composant UI**
- `src/components/GeneratePosterDialog.jsx`
  - Dialog modal pour générer l'affiche
  - Sélection du type (solo/groupée)
  - Choix de la photo
  - Sélection des athlètes avec classement

### 4. **Composant UI**
- `src/components/ui/radio-group.jsx`
  - Composant RadioGroup pour sélectionner le type d'affiche
  - Basé sur Radix UI

### 5. **Migration SQL**
- `migrations/20251218_add_ai_poster_url.sql`
  - Ajoute la colonne `ai_poster_url` à la table `competitions`
  - Stocke l'URL de l'affiche générée

### 6. **Documentation**
- `docs/GENERATION-AFFICHE-IA.md`
  - Guide complet de l'implémentation
  - Architecture et flux de données

- `docs/N8N-WEBHOOK-SETUP.md`
  - Configuration du webhook n8n
  - Format du payload et réponse attendue
  - Exemples réels
  - Troubleshooting

- `.env.example`
  - Variable `VITE_N8N_WEBHOOK_URL` pour configurer le webhook n8n

## Fichiers modifiés

### 1. **Page CompetitionDetail**
- `src/pages/CompetitionDetail.jsx`
  - Import du composant `GeneratePosterDialog`
  - Import de l'icône `Zap` depuis lucide-react
  - État `isGeneratePosterOpen` pour gérer l'affichage du dialog
  - Bouton "Générer affiche par IA" dans la barre d'actions
  - Fonction `handlePosterGenerated()` pour gérer la sauvegarde de l'affiche
  - Rendu du composant `GeneratePosterDialog`

## Fonctionnalités

### Bouton d'accès
- Position : Barre d'actions en haut de la page CompetitionDetail
- Icône : Zap (éclair)
- Texte : "Générer affiche par IA"

### Dialog de génération

**Options disponibles :**

1. **Type d'affiche**
   - Solo : 1 athlète
   - Groupée : Plusieurs athlètes (minimum 2)

2. **Sélection photo**
   - Affichage de la photo actuelle ou par défaut
   - Permet de voir l'aperçu
   - Validation requise

3. **Sélection des athlètes**
   - Liste des athlètes avec classement
   - Triés par rang ascendant
   - Maximum 20 affichés
   - Pour solo : 1 sélection
   - Pour groupée : Minimum 2 sélections

### Payload envoyé à n8n

```json
{
  "posterType": "solo" | "grouped",
  "competitionName": "Nom compétition",
  "competitionDate": "JJ/MM/AA",
  "photoUrl": "URL de la photo",
  "athletes": [
    { "name": "Athlète", "rank": 1 }
  ]
}
```

### Réponse attendue

```json
{
  "posterUrl": "https://...",
  "status": "success",
  "message": "Affiche générée"
}
```

### Sauvegarde

L'URL de l'affiche est stockée dans :
- Table : `competitions`
- Colonne : `ai_poster_url`

## Configuration

### Par défaut
L'URL est définie dans `src/config/n8n.js` :
```
https://lopez-dav.app.n8n.cloud/webhook-test/81ca48c4-0a51-466e-878d-d38f5225a339
```

### Personnalisée (via .env)
```bash
VITE_N8N_WEBHOOK_URL=https://votre-instance/webhook-xxxx
```

## Validation

### Affiche SOLO
✓ Exactement 1 athlète
✓ Photo requise
✓ Nom et date requis

### Affiche GROUPÉE
✓ Minimum 2 athlètes
✓ Photo requise
✓ Nom et date requis

## Flux utilisateur

1. Utilisateur accède à la page de détail d'une compétition
2. Clique sur "Générer affiche par IA"
3. Le dialog s'ouvre avec les options
4. Sélectionne le type d'affiche
5. Confirme la photo
6. Sélectionne les athlètes
7. Clique sur "Générer l'affiche"
8. Affichage d'un indicateur de chargement
9. Appel POST au webhook n8n
10. n8n génère l'affiche via IA
11. URL retournée et stockée dans Supabase
12. Notification de succès à l'utilisateur

## Tests recommandés

1. **Test unitaire du service n8n**
   - Validation du payload
   - Appel au webhook

2. **Test du composant modal**
   - Interaction avec les sélections
   - Validation des champs
   - État du bouton de soumission

3. **Test d'intégration**
   - Génération complète
   - Sauvegarde dans Supabase
   - Affichage des erreurs

4. **Test de l'URL n8n**
   - Avec URL par défaut
   - Avec URL personnalisée (.env)

## Notes importantes

- Les athlètes doivent avoir un classement (rank) défini
- La photo doit être une URL accessible (CORS configuré)
- La date est formatée au format français court (JJ/MM/AA)
- L'URL de l'affiche remplace la précédente si elle existe
- Support du timeout (30s par défaut)

## Extension future

Pour adapter à d'autres services d'IA ou workflows :

1. Modifier l'URL du webhook
2. Adapter le format du payload dans `n8nService.js`
3. Adapter la réponse attendue
4. Mettre à jour les validations si nécessaire

## Dépendances utilisées

- `lucide-react` : Icône Zap
- `@radix-ui/react-radio-group` : RadioGroup
- `@radix-ui/react-checkbox` : Checkbox
- `supabase` : Sauvegarde dans la BD

Aucune nouvelle dépendance NPM n'a été ajoutée.

## Migration SQL à appliquer

```sql
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS ai_poster_url text;

COMMENT ON COLUMN public.competitions.ai_poster_url 
IS 'URL of the AI-generated poster for this competition';
```

Le fichier de migration se trouve à :
`migrations/20251218_add_ai_poster_url.sql`

# Configuration n8n pour la génération d'affiche

## URL de Configuration

L'URL par défaut du webhook n8n :
```
https://lopez-dav.app.n8n.cloud/webhook-test/81ca48c4-0a51-466e-878d-d38f5225a339
```

## Alternative : Utiliser une variable d'environnement

1. Créer un fichier `.env.local` à la racine du projet :

```bash
# .env.local
VITE_N8N_WEBHOOK_URL=https://votre-instance-n8n.com/webhook-xxxx
```

2. La configuration sera automatiquement utilisée au redémarrage du serveur

## Structure du webhook n8n

Le workflow n8n doit accepter une requête POST avec la structure suivante :

```javascript
{
  // Type d'affiche : 'solo' ou 'grouped'
  posterType: string,
  
  // Nom de la compétition
  competitionName: string,
  
  // Date au format court (JJ/MM/AA)
  competitionDate: string,
  
  // URL de la photo de la compétition
  photoUrl: string,
  
  // Tableau des athlètes avec leur classement
  athletes: [
    {
      name: string,        // Nom complet de l'athlète
      rank: number        // Classement/Rang
    }
  ]
}
```

## Réponse attendue du webhook

```javascript
{
  // URL de l'affiche générée
  posterUrl: string,
  
  // Statut (optionnel mais recommandé)
  status: "success" | "error",
  
  // Message (optionnel)
  message: string
}
```

## Exemple de payload réel

### Affiche SOLO
```json
{
  "posterType": "solo",
  "competitionName": "Championnat Régional 2025",
  "competitionDate": "18/12/25",
  "photoUrl": "https://supabase.../competition-photo.jpg",
  "athletes": [
    {
      "name": "Alice Dupont",
      "rank": 1
    }
  ]
}
```

### Affiche GROUPÉE
```json
{
  "posterType": "grouped",
  "competitionName": "Coupe de France",
  "competitionDate": "20/12/25",
  "photoUrl": "https://supabase.../comp-france.jpg",
  "athletes": [
    {
      "name": "Alice Dupont",
      "rank": 1
    },
    {
      "name": "Bob Martin",
      "rank": 2
    },
    {
      "name": "Charlie Blanc",
      "rank": 3
    }
  ]
}
```

## Workflow n8n - Étapes recommandées

1. **Webhook Trigger**
   - Accepter les requêtes POST
   - Valider le payload reçu

2. **Traitement des données**
   - Formater les données pour le modèle IA
   - Construire le prompt pour générer l'affiche

3. **Appel à l'IA**
   - Utiliser OpenAI, Replicate, ou autre service d'IA
   - Générer l'image de l'affiche

4. **Stockage (optionnel)**
   - Uploader l'image dans Supabase Storage
   - Récupérer l'URL signé

5. **Réponse**
   - Retourner le JSON avec `posterUrl`

## Tests

Pour tester le webhook localement :

```bash
curl -X POST https://lopez-dav.app.n8n.cloud/webhook-test/81ca48c4-0a51-466e-878d-d38f5225a339 \
  -H "Content-Type: application/json" \
  -d '{
    "posterType": "solo",
    "competitionName": "Test",
    "competitionDate": "18/12/25",
    "photoUrl": "https://example.com/photo.jpg",
    "athletes": [{"name": "Test Athlète", "rank": 1}]
  }'
```

## Troubleshooting

### Erreur : "Cannot POST /"
- Vérifier que l'URL du webhook est correcte
- S'assurer que le workflow n8n est actif
- Vérifier les logs du webhook

### Erreur : "posterUrl not found"
- S'assurer que la réponse du webhook contient `posterUrl`
- Vérifier le format JSON de la réponse

### Affiche non générée
- Vérifier le payload envoyé
- S'assurer que la photo est accessible
- Vérifier les limites de l'API IA utilisée

## Documentation n8n officielle

- [Webhook n8n](https://docs.n8n.io/workflows/triggers/webhook/)
- [HTTP Request node](https://docs.n8n.io/nodes/nodes-library/nodes/n8n-nodes-base.httprequest/)

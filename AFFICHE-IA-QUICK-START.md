# 🎨 Génération d'Affiche par IA - RÉSUMÉ RAPIDE

## 📍 Localisation du bouton
**Page** : Détail de la compétition (`CompetitionDetail.jsx`)  
**Position** : Barre d'actions en haut (avant "Exporter PNG")  
**Icône** : ⚡ Zap  
**Texte** : "Générer affiche par IA"

## 🎯 Flux

```
Clic bouton 
  → Dialog s'ouvre
    → Sélectionner type (solo/groupée)
    → Choisir photo
    → Sélectionner athlète(s)
    → Cliquer "Générer"
      → POST n8n
      → n8n génère l'affiche
      → URL retournée
      → Stockée dans Supabase (ai_poster_url)
```

## 📦 Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/components/GeneratePosterDialog.jsx` | Interface modal |
| `src/services/n8nService.js` | Appel API n8n |
| `src/config/n8n.js` | Configuration URL |
| `migrations/20251218_add_ai_poster_url.sql` | Schéma BD |

## 🔌 API n8n

**Endpoint** : Configurable
**Défaut** : `https://lopez-dav.app.n8n.cloud/webhook-test/81ca48c4-0a51-466e-878d-d38f5225a339`

**Payload** :
```json
{
  "posterType": "solo" ou "grouped",
  "competitionName": "Nom compétition",
  "competitionDate": "JJ/MM/AA",
  "photoUrl": "https://...",
  "athletes": [{"name": "...", "rank": 1}]
}
```

**Réponse attendue** :
```json
{ "posterUrl": "https://...", "status": "success" }
```

## ⚙️ Configuration

### Par défaut (aucune action requise)
Utilise l'URL fournie par défaut

### Personnalisée
Créer `.env.local` :
```bash
VITE_N8N_WEBHOOK_URL=https://votre-instance/webhook-xxxx
```

## 🗄️ Base de données

**Colonne ajoutée** : `ai_poster_url` dans `competitions`  
**Type** : `text`  
**Migration** : `20251218_add_ai_poster_url.sql`

Appliquer :
```sql
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS ai_poster_url text;
```

## ✅ Validations

✓ Type d'affiche valide  
✓ Photo requise  
✓ Athlètes requis (1 solo, 2+ groupée)  
✓ Nom et date requis

## 📚 Documentation

| Document | Contenu |
|----------|---------|
| `GENERATION-AFFICHE-IA.md` | Architecture et détails |
| `N8N-WEBHOOK-SETUP.md` | Configuration n8n |
| `IMPLEMENTATION-AFFICHE-IA.md` | Résumé modifications |
| `POSTER-GENERATION-EXAMPLES.json` | Exemples payloads |
| `CHECKLIST-AFFICHE-IA.md` | Tests à faire |

## 🚀 Mise en production

1. **Appliquer migration SQL** dans Supabase
2. **Tester en local**
3. **Configurer n8n** si URL personnalisée
4. **Build et déployer** : `npm run build && npm run deploy`

## 🐛 Tests manuels

- [ ] Bouton visible
- [ ] Dialog s'ouvre
- [ ] Types sélectionnables
- [ ] Photo affichée
- [ ] Athlètes listés
- [ ] Validation fonctionne
- [ ] Génération lance appel n8n
- [ ] URL sauvegardée

## 📞 Points clés

- **Aucune nouvelle dépendance** NPM
- **Pas de breaking changes**
- **Configuration externalisée** (env/config)
- **Gestion erreurs complète**
- **Documentation exhaustive**

---

✨ **Prêt pour utilisation** - Appliquer migration SQL et configurer n8n

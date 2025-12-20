# 🚀 Guide de Démarrage - Génération d'Affiche par IA

## 📖 Commencer ici

Vous venez de recevoir une nouvelle fonctionnalité pour générer des affiches par IA. Voici comment naviguer dans la documentation :

---

## ⚡ Je suis pressé (5 minutes)
**Lire** : [`AFFICHE-IA-QUICK-START.md`](AFFICHE-IA-QUICK-START.md)
- Vue d'ensemble rapide
- Points clés
- Checklist de mise en prod

---

## 📚 Je veux comprendre (20 minutes)
**Lire** : [`docs/GENERATION-AFFICHE-IA.md`](docs/GENERATION-AFFICHE-IA.md)
- Architecture complète
- Format des données
- Configuration

---

## ⚙️ Je dois configurer n8n (30 minutes)
**Lire** : [`docs/N8N-WEBHOOK-SETUP.md`](docs/N8N-WEBHOOK-SETUP.md)
- Installation du webhook
- Structure du workflow
- Exemples de payloads
- Troubleshooting

---

## 🔍 Je veux vérifier les détails (1 heure)
**Lire** : [`docs/IMPLEMENTATION-AFFICHE-IA.md`](docs/IMPLEMENTATION-AFFICHE-IA.md)
- Liste complète des fichiers
- Modifications précises
- Fonctionnalités détaillées

---

## ✅ Je dois tester (2 heures)
**Lire** : [`docs/CHECKLIST-AFFICHE-IA.md`](docs/CHECKLIST-AFFICHE-IA.md)
- Checklist de vérification
- Tests manuels étape par étape
- Vérification de chaque point

---

## 📊 Vue d'ensemble visuelle

```
Utilisateur accède à CompetitionDetail
                    ↓
         Clique sur "Générer affiche par IA"
                    ↓
         Dialog s'ouvre avec options
                    ↓
    ┌─────────────────────────────────┐
    │  Sélectionner type d'affiche    │
    │  - Solo (1 athlète)             │
    │  - Groupée (2+ athlètes)        │
    └─────────────────────────────────┘
                    ↓
    ┌─────────────────────────────────┐
    │  Choisir une photo              │
    │  (Prévisualisation disponible)  │
    └─────────────────────────────────┘
                    ↓
    ┌─────────────────────────────────┐
    │  Sélectionner les athlètes      │
    │  (Triés par classement)         │
    └─────────────────────────────────┘
                    ↓
         Cliquer "Générer"
                    ↓
         POST au webhook n8n
                    ↓
       n8n génère l'affiche via IA
                    ↓
       URL de l'affiche retournée
                    ↓
    Sauvegarde dans Supabase (ai_poster_url)
                    ↓
    Affichage confirmation utilisateur
```

---

## 📁 Structure des fichiers

### 📝 Fichiers de documentation (lire dans cet ordre)
1. **[AFFICHE-IA-QUICK-START.md](AFFICHE-IA-QUICK-START.md)** - Démarrage rapide
2. **[docs/GENERATION-AFFICHE-IA.md](docs/GENERATION-AFFICHE-IA.md)** - Architecture
3. **[docs/N8N-WEBHOOK-SETUP.md](docs/N8N-WEBHOOK-SETUP.md)** - Configuration n8n
4. **[docs/IMPLEMENTATION-AFFICHE-IA.md](docs/IMPLEMENTATION-AFFICHE-IA.md)** - Détails
5. **[docs/CHECKLIST-AFFICHE-IA.md](docs/CHECKLIST-AFFICHE-IA.md)** - Tests
6. **[docs/POSTER-GENERATION-EXAMPLES.json](docs/POSTER-GENERATION-EXAMPLES.json)** - Exemples

### 💻 Fichiers de code
- **`src/components/GeneratePosterDialog.jsx`** - Composant modal
- **`src/services/n8nService.js`** - Service API n8n
- **`src/config/n8n.js`** - Configuration
- **`src/components/ui/radio-group.jsx`** - Composant RadioGroup

### 🗄️ Base de données
- **`migrations/20251218_add_ai_poster_url.sql`** - Migration SQL

---

## 🎯 Tasks par rôle

### 👨‍💼 Chef de projet
- [ ] Lire `AFFICHE-IA-QUICK-START.md`
- [ ] Valider avec l'équipe
- [ ] Planifier les tests

### 👨‍💻 Développeur backend
- [ ] Lire `docs/N8N-WEBHOOK-SETUP.md`
- [ ] Configurer le workflow n8n
- [ ] Tester le webhook

### 👨‍💻 Développeur frontend
- [ ] Lire `docs/IMPLEMENTATION-AFFICHE-IA.md`
- [ ] Effectuer les tests manuels
- [ ] Valider l'intégration

### 🗄️ Admin base de données
- [ ] Appliquer la migration SQL
- [ ] Vérifier la colonne `ai_poster_url`
- [ ] Tester les SELECT/UPDATE

### 🧪 QA/Testeur
- [ ] Lire `docs/CHECKLIST-AFFICHE-IA.md`
- [ ] Suivre la checklist de tests
- [ ] Reporter les bugs

---

## 🔧 Étapes de mise en production

### 1️⃣ Préparation (30 min)
```bash
# Appliquer la migration SQL
# Voir: migrations/20251218_add_ai_poster_url.sql

# Ou via Supabase:
ALTER TABLE public.competitions
ADD COLUMN IF NOT EXISTS ai_poster_url text;
```

### 2️⃣ Configuration n8n (1-2 h)
- Lire `docs/N8N-WEBHOOK-SETUP.md`
- Adapter le workflow n8n
- Tester avec exemples

### 3️⃣ Tests locaux (1-2 h)
- Suivre `docs/CHECKLIST-AFFICHE-IA.md`
- Tester chaque étape
- Vérifier les erreurs

### 4️⃣ Déploiement (30 min)
```bash
npm run build
npm run deploy
```

### 5️⃣ Validation en prod (1 h)
- Tester sur le serveur en production
- Vérifier les logs
- Monitorer les erreurs

---

## 📞 FAQ Rapide

### Q: Où ajouter le bouton?
**R**: Le bouton est déjà ajouté automatiquement sur la page CompetitionDetail

### Q: Comment configurer l'URL n8n?
**R**: Via `.env.local` ou `.env` :
```bash
VITE_N8N_WEBHOOK_URL=https://votre-url
```

### Q: Quelles données sont envoyées à n8n?
**R**: Voir `docs/POSTER-GENERATION-EXAMPLES.json`

### Q: Où est stockée l'URL de l'affiche?
**R**: Dans `competitions.ai_poster_url`

### Q: Comment tester sans n8n?
**R**: Voir `docs/N8N-WEBHOOK-SETUP.md` - section Tests

---

## 🆘 Support

### Documentation complète
- Voir le dossier `docs/`

### Exemples réels
- Voir `docs/POSTER-GENERATION-EXAMPLES.json`

### Troubleshooting
- Voir `docs/N8N-WEBHOOK-SETUP.md` - section Troubleshooting

---

## ✨ Summary

| Élément | Details |
|---------|---------|
| **Nouvelles fichiers** | 14 |
| **Fichiers modifiés** | 2 |
| **Dépendances nouvelles** | 0 (aucune) |
| **Breaking changes** | Non |
| **Temps mise en prod** | 3-4 heures |
| **État** | ✅ Prêt à déployer |

---

## 🚀 Commencez!

1. **Lecteur rapide?** → [`AFFICHE-IA-QUICK-START.md`](AFFICHE-IA-QUICK-START.md)
2. **Besoin des détails?** → [`docs/GENERATION-AFFICHE-IA.md`](docs/GENERATION-AFFICHE-IA.md)
3. **Prêt à configurer?** → [`docs/N8N-WEBHOOK-SETUP.md`](docs/N8N-WEBHOOK-SETUP.md)
4. **Temps de tester?** → [`docs/CHECKLIST-AFFICHE-IA.md`](docs/CHECKLIST-AFFICHE-IA.md)

---

**Date** : 18 Décembre 2025  
**Version** : 1.0.0  
**État** : ✅ Prêt pour utilisation

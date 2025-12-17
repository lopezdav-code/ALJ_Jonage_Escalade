# 🚀 FFME Competition Scraper - DÉMARRAGE RAPIDE

## ⏱️ 5 minutes pour commencer

### Étape 1: Appliquer la migration (2 min)

**Sur Windows** 💻:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-ffme-migration.ps1
```

**Sur Mac/Linux** 🍎🐧:
```bash
bash scripts/apply-ffme-migration.sh
```

Le script va afficher le SQL. **Copiez-le**.

### Étape 2: Exécuter le SQL (1 min)

1. Allez sur: https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez à: **SQL Editor** (en bas à gauche)
4. Cliquez: **New query**
5. **Collez** le SQL
6. Cliquez: **Run**

✅ **Fait!** La table est créée.

### Étape 3: Vérifier (1 min)

```bash
node scripts/verify-ffme-setup.js
```

Vous devriez voir: ✅ All checks passed!

### Étape 4: Tester (1 min)

1. Ouvrez: http://localhost:3000/ALJ_Jonage_Escalade/competitions
2. Cliquez sur l'onglet: **"Scraper FFME"**
3. Entrez: Start = 13150, End = 13160
4. Cliquez: **"Démarrer le scraping"**
5. Regardez la barre de progression ✨

### Étape 5: Vérifier les résultats (0 min)

1. Allez sur Supabase → **Tables**
2. Sélectionnez: **ffme_competitions_index**
3. Vous devriez voir 10 rangées avec des titres de compétitions ✅

---

## 🎉 C'est fait!

Vous pouvez maintenant:

### Utiliser depuis l'interface web
- Page Compétitions → Onglet "Scraper FFME"
- Entrer les IDs et lancer le scraping
- Voir les résultats en temps réel

### Utiliser depuis le CLI
```bash
# Plage par défaut (13150-13160)
node scripts/scrape-ffme-competitions.js

# Plage personnalisée
node scripts/scrape-ffme-competitions.js 13100 13200
```

### Utiliser dans votre code
```javascript
import { searchFFMECompetitions } from '@/services/ffmeCompetitionsService';

async function findCompetition() {
  const results = await searchFFMECompetitions('13150');
  console.log('Trouvé:', results);
}
```

---

## ❓ Questions fréquentes

**Q: Le scraper s'arrête immédiatement?**  
A: L'ID 13150 n'existe pas. Essayez un autre ID que vous connaissez.

**Q: "Pas de titre trouvé"?**  
A: La page FFME a peut-être une structure différente. Vérifiez manuellement l'URL.

**Q: "HTTP 404"?**  
A: Cet ID n'existe pas sur le site FFME. Essayez une autre plage.

**Q: Table déjà existe?**  
A: Normal! C'est l'upsert qui met à jour les données.

**Q: Autres erreurs?**  
A: Consultez `docs/ffme-scraper-guide.md` section "Dépannage"

---

## 📚 Documentation complète

Pour en savoir plus, consultez:
- **docs/ffme-scraper-guide.md** - Guide complet
- **FFME_SCRAPER_SETUP.md** - Checklist détaillée
- **FFME_SCRAPER_IMPLEMENTATION.md** - Résumé technique
- **FFME_SCRAPER_INDEX.md** - Vue d'ensemble

---

## 🔍 Vérification

Commande pour vérifier que tout est correct:
```bash
node scripts/verify-ffme-setup.js
```

Cette commande vérifie:
- ✅ Tous les fichiers présents
- ✅ Dépendances installées
- ✅ Configuration Supabase
- ✅ Node.js version
- ✅ Et plus...

---

## 💪 Vous êtes prêt!

Bon scraping! 🚀

Des questions? Consultez la documentation ou vérifiez les logs dans la console (F12).

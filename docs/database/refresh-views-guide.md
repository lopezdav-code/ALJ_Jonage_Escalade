# Guide : Rafraîchir les Vues Matérialisées

## 🎯 Quelle Option Choisir ?

| Approche | Actualité | Coût | Complexité | Idéale Pour |
|----------|-----------|------|-----------|------------|
| **pg_cron (Quotidien)** | À jour 1x/jour | 📍 Bas | 🟢 Simple | **Rapports, statistiques, dashboards** |
| **pg_cron (Toutes les heures)** | À jour 1x/heure | 📍 Bas | 🟢 Simple | **Données moyennement volatiles** |
| **Triggers** | En temps réel | 📍❌ Très haut | 🔴 Complexe | **Données très volatiles (rare)** |
| **Application** | Contrôlée | 📍 Moyen | 🟡 Moyen | **Actions spécifiques après modifications** |
| **Combinaison** | Hybrid | 📍 Moyen | 🟡 Moyen | **Balance entre temps réel et performance** |

---

## 🚀 RECOMMANDATION POUR VOTRE PROJET

### **Option 1 : pg_cron + Application (RECOMMANDÉE)**

Utilisez **pg_cron pour un rafraîchissement automatique la nuit**, et **appelez manuellement depuis l'application** après des modifications importantes.

```javascript
// Après une modification importante
const { refreshAllViews } = useRefreshMaterializedViews();

// Par exemple, après création d'une session
await createSession(data);
await refreshAllViews(); // Rafraîchir immédiatement
```

**Avantages :**
- ✅ Automatique la nuit (pg_cron)
- ✅ À jour après modifications importantes
- ✅ Coût minimal
- ✅ Performance optimale

---

## 📝 ÉTAPES D'IMPLÉMENTATION

### Étape 1 : Exécuter les Fonctions RPC

```bash
# Dans Supabase SQL Editor, exécuter :
scripts/create-refresh-functions.sql
```

### Étape 2 : Configurer pg_cron (Optionnel)

```bash
# Dans Supabase SQL Editor, exécuter :
scripts/setup-cron-refresh.sql

# Choisir l'une des options cron (lignes 10, 17, ou 23)
```

### Étape 3 : Utiliser le Hook React

```javascript
import { useRefreshMaterializedViews } from '@/hooks/useRefreshMaterializedViews';

export function SessionForm() {
  const { refreshAllViews, refreshSpecificView } = useRefreshMaterializedViews();

  const handleCreateSession = async (data) => {
    // Créer la session
    await supabase.from('sessions').insert([data]);

    // Rafraîchir les vues affectées
    await refreshSpecificView('attendance_summary');
    await refreshSpecificView('member_statistics');
  };

  return (
    // ...formulaire...
  );
}
```

---

## 🔧 DÉTAILS TECHNIQUES

### pg_cron - Formats de Planification

```
Format : "minute heure jour_du_mois mois jour_de_la_semaine"

Exemples :
'0 2 * * *'      → Tous les jours à 2h du matin
'0 */6 * * *'    → Toutes les 6 heures
'*/30 * * * *'   → Toutes les 30 minutes
'0 2 * * 0'      → Tous les dimanches à 2h
'0 2 1 * *'      → Premier jour du mois à 2h
'0 2 * * 1-5'    → Lun-Ven à 2h (jours ouvrables)
```

### Triggers PostgreSQL - Structure

```sql
-- Les triggers rafraîchissent les vues automatiquement
-- Créer par : scripts/setup-triggers-refresh.sql

-- Qui rafraîchit après les modifications :
- sessions        → attendance_summary, member_statistics
- members         → member_statistics
- competitions    → member_statistics
- passeport_val   → member_statistics
- pedagogy_sheets → pedagogy_sheet_usage
- exercises       → pedagogy_sheet_usage
```

### RPC Functions - Appels JavaScript

```javascript
// Rafraîchir tout
const { data, error } = await supabase.rpc('refresh_all_materialized_views');

// Rafraîchir une vue
const { data, error } = await supabase.rpc('refresh_materialized_view', {
  view_name: 'attendance_summary'
});

// Vérifier le dernier rafraîchissement
const { data: status } = await supabase.rpc('get_last_refresh_status');
console.log(status);
// [
//   { view_name: "attendance_summary", status: "success", refreshed_at: "2025-11-16..." },
//   { view_name: "member_statistics", status: "success", refreshed_at: "2025-11-16..." },
//   ...
// ]
```

---

## ⚠️ PIÈGES À ÉVITER

### ❌ NE PAS faire :
```javascript
// ❌ Rafraîchir après CHAQUE modification
// (trop coûteux)
users.forEach(async (user) => {
  await updateUser(user);
  await refreshAllViews(); // ❌ À CHAQUE fois = très cher
});

// ❌ Utiliser les triggers sans limiter
// (peuvent ralentir considérablement les inserts)
```

### ✅ À FAIRE :
```javascript
// ✅ Rafraîchir une fois après une boucle
users.forEach(async (user) => {
  await updateUser(user);
  // Pas de refresh ici
});
await refreshAllViews(); // ✅ Une seule fois à la fin

// ✅ Rafraîchir seulement si nécessaire
if (isImportantChange) {
  await refreshSpecificView('member_statistics');
}

// ✅ Utiliser pg_cron pour l'automatique
// (ne rafraîchit que la nuit)
```

---

## 📊 PERFORMANCE

### Temps de Rafraîchissement Estimé

| Vue | Nombre de lignes | Temps |
|-----|------------------|-------|
| attendance_summary | ~1000 | ~100ms |
| member_statistics | ~500 | ~200ms |
| pedagogy_sheet_usage | ~50 | ~50ms |
| **Toutes** | - | **~350ms** |

### Impact sur les Utilisateurs

**pg_cron (nuit)** : Aucun impact
**Application (après modif)** : +350ms maximum en arrière-plan
**Triggers (chaque modif)** : +200-500ms à chaque INSERT/UPDATE/DELETE

---

## 🔍 MONITORING

### Vérifier les jobs cron

```sql
-- Dans Supabase SQL Editor
SELECT job_id, jobname, schedule, command, enabled
FROM cron.job
WHERE jobname LIKE 'refresh%';
```

### Voir l'historique des rafraîchissements

```sql
-- Voir les 10 derniers rafraîchissements
SELECT view_name, refresh_status, error_message, refreshed_at
FROM materialized_view_refresh_log
ORDER BY refreshed_at DESC
LIMIT 10;
```

### Tester le rafraîchissement

```sql
-- Dans Supabase SQL Editor
SELECT refresh_all_materialized_views();
-- Résultat : {"success": true, "message": "..."}
```

---

## 📁 FICHIERS CRÉÉS

1. **scripts/setup-cron-refresh.sql**
   - Configuration pg_cron pour rafraîchissement automatique
   - Options : nuit, toutes les heures, toutes les 30 min

2. **scripts/setup-triggers-refresh.sql**
   - Triggers PostgreSQL pour rafraîchissement en temps réel
   - ⚠️ À utiliser avec prudence (coûteux)

3. **scripts/create-refresh-functions.sql**
   - Fonctions RPC pour appeler depuis JavaScript
   - Logging du statut de rafraîchissement

4. **src/hooks/useRefreshMaterializedViews.js**
   - Hook React pour rafraîchir depuis l'application
   - Exemples d'utilisation inclus

---

## 🎓 RESSOURCES

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pgtap)
- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)

---

## 💡 PROCHAINES ÉTAPES

1. ✅ Exécuter `scripts/create-optimized-views.sql` pour créer les vues
2. ✅ Exécuter `scripts/add-performance-indexes.sql` pour les index
3. ⏭️ Exécuter `scripts/create-refresh-functions.sql` pour les RPC
4. ⏭️ Exécuter `scripts/setup-cron-refresh.sql` pour pg_cron
5. ⏭️ Intégrer le hook `useRefreshMaterializedViews` dans votre code
6. ⏭️ Tester avec `SELECT refresh_all_materialized_views();`


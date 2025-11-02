# Audit des Pages avec Contrôle d'Accès Codé en Dur

## Résumé Exécutif
**Status**: 28 pages sur le codebase utilisent un contrôle d'accès codé en dur  
**Corrigé**: SessionLog.jsx ✅  
**À corriger**: 27 pages  

---

## Catégorie 1: Pages Admin (Toujours Admin-Only)
Ces pages doivent RESTER avec un contrôle strict à admin uniquement.

### Pages à CONSERVER en Admin-Only:
1. **AccessLogs.jsx** - Logs d'accès système
2. **AdminManagement.jsx** - Configuration des rôles et permissions
3. **BureauManagement.jsx** - Gestion du bureau
4. **ConnectionLogs.jsx** - Logs de connexion
5. **GroupeAdmin.jsx** - Gestion des groupes
6. **ImageAdmin.jsx** - Gestion des images
7. **MemberGroupTest.jsx** - Tests de groupes de membres
8. **Pedagogy.jsx** - Gestion pédagogique
9. **PedagogyEditor.jsx** - Éditeur pédagogique
10. **Permissions.jsx** - Configuration des permissions
11. **Schedule.jsx** - Gestion des plannings
12. **ScheduleAdmin.jsx** - Admin des plannings
13. **ScheduleEdit.jsx** - Édition des plannings
14. **SiteSettings.jsx** - Paramètres du site

**Action Requise**: Vérifier que leur logique est correcte (elle l'est probablement, mais utiliser une constante réutilisable pour `isAdmin` check).

---

## Catégorie 2: Pages avec Accès Conditionnel (À Corriger avec usePageAccess)

### Pages avec configuration de rôles mixtes (admin, encadrant, bureau, adherent):

#### Niveau 1: Pages Encadrant+ (encadrant, admin)
1. **AttendanceRecap.jsx**
   - Contrôle actuel: `!isAdmin && !isEncadrant`
   - À corriger: Utiliser usePageAccess() + vérifier canEdit avec isAdmin ou isEncadrant

2. **CycleDetail.jsx**
   - Contrôle actuel: `canManageCycles = isAdmin || isEncadrant`
   - À corriger: Utiliser usePageAccess() + keep canManage pour édition

3. **CycleManagement.jsx**
   - Contrôle actuel: `canManageCycles = isAdmin || isEncadrant`
   - À corriger: Utiliser usePageAccess() + keep canManage pour édition

#### Niveau 2: Pages Bureau+ (bureau, admin)
4. **MemberEdit.jsx**
   - Contrôle actuel: `isAdminOrBureau = userRole === 'admin' || userRole === 'bureau'`
   - À corriger: Utiliser usePageAccess() pour l'accès, keep bureau pour édition

5. **MemberView.jsx**
   - Contrôle actuel: `canEdit = isAdmin || isBureau`
   - À corriger: Utiliser usePageAccess() pour l'accès, keep canEdit pour l'édition

6. **Volunteers.jsx**
   - Contrôle actuel: `canEdit = isAdmin || isBureau`
   - À corriger: Utiliser usePageAccess() pour l'accès, keep canEdit

#### Niveau 3: Pages Compétitions (admin, bureau, encadrant)
7. **ClubCompetitions.jsx**
   - Contrôle actuel: `canCreate = isAdmin || isBureau || isEncadrant`
   - À corriger: Utiliser usePageAccess() pour l'accès, keep canCreate

8. **CompetitionDetail.jsx**
   - Contrôle actuel: `canEdit = isAdmin || isBureau || isEncadrant`
   - À corriger: Utiliser usePageAccess() pour l'accès, keep canEdit

9. **Competitions.jsx**
   - Contrôle actuel: `canEdit = isAdmin || isBureau || isEncadrant`
   - À corriger: Utiliser usePageAccess() pour l'accès, keep canEdit

#### Niveau 4: Pages Adhérent+ (adherent, bureau, encadrant, admin)
10. **SessionEdit.jsx**
    - Contrôle actuel: `canEditContent = !authLoading && isAdmin`
    - À corriger: Utiliser usePageAccess() pour l'accès à la page

#### Niveau 5: Pages Actualités (avec permissions avancées)
11. **News.jsx**
    - Contrôle actuel: `isAdmin || isAdherent` + useNewsPermissions()
    - À corriger: Utiliser usePageAccess() + keep useNewsPermissions() pour les actions avancées

12. **NewsDetail.jsx**
    - Contrôle actuel: `isAdmin || isAdherent`
    - À corriger: Utiliser usePageAccess()

#### Niveau 6: Pages Spéciales
13. **PasseportViewer.jsx**
    - Contrôle actuel: `{isAdmin && !isEditing}`
    - À corriger: Utiliser usePageAccess() pour l'accès

---

## Plan de Correction par Phase

### Phase 1: Validation (DÉJÀ FAIT)
✅ SessionLog.jsx - Corrigé pour utiliser usePageAccess()

### Phase 2: Catégories Claires (Facile - 2-3h)
- AttendanceRecap.jsx
- CycleDetail.jsx
- CycleManagement.jsx
- SessionEdit.jsx
- PasseportViewer.jsx

### Phase 3: Pages avec Permissions Avancées (Moyen - 4-5h)
- News.jsx (nécessite coordination avec useNewsPermissions())
- NewsDetail.jsx
- MemberEdit.jsx
- MemberView.jsx

### Phase 4: Pages avec Logique Mixte (Plus complexe - 3-4h)
- Volunteers.jsx
- ClubCompetitions.jsx
- CompetitionDetail.jsx
- Competitions.jsx

### Phase 5: Vérification Pages Admin (Moins urgent - 1h)
- AccessLogs.jsx
- AdminManagement.jsx
- BureauManagement.jsx
- ConnectionLogs.jsx
- GroupeAdmin.jsx
- ImageAdmin.jsx
- MemberGroupTest.jsx
- Pedagogy.jsx
- PedagogyEditor.jsx
- Permissions.jsx
- Schedule.jsx
- ScheduleAdmin.jsx
- ScheduleEdit.jsx
- SiteSettings.jsx

---

## Configuration BDD Requise

Le JSON fourni est la `permissions_config` (permissions par action).  
La page `/session-log` est configurée dans `nav_config` avec les rôles: `['adherent', 'bureau', 'encadrant', 'admin']`

Pour vérifier en SQL:
```sql
SELECT config_key, config_value FROM site_config 
WHERE config_key IN ('nav_config', 'permissions_config');
```

---

## Résultat Attendu après Corrections

✅ Toutes les pages utiliseront `usePageAccess()` pour déterminer l'accès initial  
✅ Les pages admin resteront en contrôle strict  
✅ Les pages avec accès conditionnel respecteront la configuration `nav_config` en BDD  
✅ Le rôle "bureau" aura accès aux pages configurées (notamment session-log)  
✅ Les permissions granulaires (create/edit) resteront gérées par les hooks spécifiques ou isAdmin  


# Authorization System Refactoring Plan

## 📋 Overview
Complete refactoring of the authorization system to make it fully consistent and configurable.

## 🎯 New Role Determination Logic

### Role Priority (checked in order):
1. **Admin**: `profiles.role = 'admin'`
2. **Bureau**: Exists in `bureau` table with `role != 'Bénévole'`
3. **Encadrant**: Exists in `bureau` table with `role = 'Bénévole'`
4. **Adhérent**: Exists in `membres` table with `groupe_id IS NOT EMPTY`
5. **User**: Authenticated user (none of the above)
6. **Public**: Not authenticated

## 🔧 Implementation Steps

### Phase 1: Core Authorization System
- [x] Analyze current system
- [ ] Refactor `SupabaseAuthContext.jsx` with new role logic
- [ ] Create unified `useAuthorization.js` hook
- [ ] Update `usePageAccess.js` hook
- [ ] Create `usePermissions.js` hook for button-level permissions

### Phase 2: Authorization Management UI
- [ ] Create new unified `AuthorizationManagement.jsx` page
  - Tab 1: User Roles (existing UserRoles.jsx)
  - Tab 2: Page Access (existing AdminManagement.jsx)
  - Tab 3: Feature Permissions (existing Permissions.jsx)
  - Tab 4: Bureau Roles (existing BureauManagement.jsx)
- [ ] Professional design with clear sections
- [ ] Real-time permission preview

### Phase 3: Update All Pages
- [ ] Update 13 pages with conditional access
- [ ] Update 14 admin-only pages
- [ ] Update 7 components with permission checks
- [ ] Add consistent permission checks to all buttons

### Phase 4: Clean Up
- [ ] Remove outdated SQL scripts
- [ ] Remove unused database insertion files
- [ ] Remove deprecated migration files
- [ ] Update documentation

### Phase 5: Testing & Deployment
- [ ] Test all roles across all pages
- [ ] Test all button permissions
- [ ] Update E2E tests
- [ ] Commit and push

## 📊 Files to Update

### Core Files (3)
- `/src/contexts/SupabaseAuthContext.jsx`
- `/src/hooks/usePageAccess.js`
- `/src/pages/AuthorizationManagement.jsx` (NEW)

### Pages with Conditional Access (13)
- AttendanceRecap.jsx
- CycleDetail.jsx
- CycleManagement.jsx
- ExerciseProgress.jsx
- MemberEdit.jsx
- MemberView.jsx
- Volunteers.jsx
- ClubCompetitions.jsx
- CompetitionDetail.jsx
- Competitions.jsx
- News.jsx
- NewsDetail.jsx
- PasseportViewer.jsx

### Admin Pages (14)
- AccessLogs.jsx
- AdminManagement.jsx (to be merged)
- BureauManagement.jsx (to be merged)
- ConnectionLogs.jsx
- GroupeAdmin.jsx
- ImageAdmin.jsx
- MemberGroupTest.jsx
- Pedagogy.jsx
- PedagogyEditor.jsx
- Permissions.jsx (to be merged)
- Schedule.jsx
- ScheduleAdmin.jsx
- ScheduleEdit.jsx
- SiteSettings.jsx

### Components (7)
- Navigation.jsx
- SessionList.jsx
- ParticipantsDisplay.jsx
- MemberDetailCard.jsx
- VolunteerQuiz.jsx
- CompetitionCard.jsx

## 🗑️ Files to Remove

### Old SQL Scripts (candidates for removal)
- `/scripts/add-illustration-image-to-pedagogy-sheets.sql`
- `/scripts/clean-pedagogy-submenu.sql`
- `/scripts/create-*.sql` (old creation scripts)
- `/scripts/add-*.sql` (old migration scripts)
- `/scripts/test-*.sql` (test scripts)

### Old Migration Files
- `/migration_schedule.sql`
- Files in `/scripts/` that are no longer relevant

## 🎨 New Authorization Management Page Structure

```
AuthorizationManagement.jsx
├── Tab 1: User Management
│   ├── Create users
│   ├── Assign roles
│   └── Link to members
├── Tab 2: Bureau Roles
│   ├── Assign board positions
│   └── Set encadrant status
├── Tab 3: Page Access
│   ├── Configure page visibility by role
│   └── Real-time menu preview
└── Tab 4: Feature Permissions
    ├── Create/Edit/Delete permissions
    └── Per-module granular control
```

## ✅ Success Criteria

- [ ] All roles determined correctly from database
- [ ] All pages have consistent authorization
- [ ] All buttons have permission checks
- [ ] Authorization management is centralized and clear
- [ ] No unnecessary files remain
- [ ] All tests pass

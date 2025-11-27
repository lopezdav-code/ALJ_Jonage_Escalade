# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Development Commands

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
# Starts Vite dev server on port 3000
# Accessible at: http://localhost:3000/ALJ_Jonage_Escalade/
```

### Build & Deploy
```bash
npm run build              # Build for production
npm run preview            # Preview production build
npm run deploy             # Deploy to GitHub Pages
```

### Testing
```bash
# Run all E2E tests (Cypress - headless)
npm test
# or
npm run test:e2e

# Open Cypress interactive UI
npm run test:e2e:ui

# Run a single test file
npx cypress run --spec "cypress/e2e/specific-test.cy.js"

# Run tests matching a pattern
npx cypress run --spec "cypress/e2e/**/*admin*.cy.js"
```

### Database
```bash
npm run update-schema      # Update schema.json from Supabase
```

## High-Level Architecture

### State Management - React Context API

The application uses **React Context API** exclusively (no Redux/Zustand). Three main contexts orchestrate global state:

**SupabaseAuthContext** ([src/contexts/SupabaseAuthContext.jsx](src/contexts/SupabaseAuthContext.jsx))
- Manages authentication and role-based access control (RBAC)
- **6-level role hierarchy** computed from multiple tables:
  - `public` → Unauthenticated users
  - `user` → Authenticated but no special role
  - `adherent` → Members with `groupe_id` (from `membres` table)
  - `encadrant` → Volunteers (`bureau` table with `role='Bénévole'`)
  - `bureau` → Board members (`bureau` table, `role != 'Bénévole'`)
  - `admin` → Administrators (`profiles.role='admin'`)
- Implements **profile caching** with 5-minute TTL for performance
- Request deduplication prevents concurrent duplicate queries
- Security timeout: 5 seconds max for session loading

**ConfigContext** ([src/contexts/ConfigContext.jsx](src/contexts/ConfigContext.jsx))
- Site configuration from `site_config` database table
- Real-time updates via Supabase channels
- Key-value store pattern for dynamic settings

**MemberDetailContext** ([src/contexts/MemberDetailContext.jsx](src/contexts/MemberDetailContext.jsx))
- Member detail modal/card state
- Member editing workflow state
- Role-based field visibility

### Authentication & Permissions System

**Dynamic Permission Architecture**:
- Permissions stored as JSON in `site_config.permissions_config`
- Runtime evaluation via `usePageAccess` hook (not route guards)
- **Hard-coded overrides** for critical admin pages (`/site-settings`, `/database-management`, `/admin-dashboard`) - security measure to prevent accidental lockout
- Supabase Auth with JWT tokens and auto-refresh
- Row-Level Security (RLS) policies on database tables

**Permission Flow**:
```
Database (site_config.permissions_config JSON)
    ↓
ConfigContext (real-time sync)
    ↓
usePageAccess hook (runtime evaluation)
    ↓
Component (conditional rendering/access)
```

### Data Flow & Database Interaction

**Pattern**: Direct Supabase queries from components (no repository/service layer)

```
Supabase DB → Supabase Client → Context Providers → Pages/Components → UI
                                        ↓
                                  Custom Hooks
                                  (useAuth, useConfig, usePageAccess)
```

**Key Characteristics**:
- Real-time subscriptions via Supabase channels (config, news, competitions)
- Client-side filtering and sorting (not database-level) - may not scale well
- Direct `supabase.from()` calls in components
- Heavy reliance on Supabase vendor lock-in

### Performance Optimizations

Configured in [src/config/performance.js](src/config/performance.js):

- **Profile caching**: 5-minute TTL with Map-based storage
- **Request deduplication**: Pending requests tracked to prevent duplicates
- **Lazy-loaded routes**: 60+ routes split with `React.lazy()` and Suspense
- **Session loading timeout**: 5 seconds maximum wait
- **Pagination defaults**: 20 items per page

### Security Architecture

- **Row-Level Security (RLS)**: Enforced at Supabase database level
- **RBAC computation**: Aggregates data from `profiles`, `bureau`, and `membres` tables
- **Secure views**: `secure_members` table for filtered member data
- **Edge functions**: Admin-only operations (e.g., `admin-create-user`)
- **Signed URLs**: For private Supabase storage bucket access

### Image Management System

Global error protection and fallback mechanisms:

- **Global protection**: [src/lib/globalImageProtection.js](src/lib/globalImageProtection.js)
- **Signed URLs**: For private Supabase storage buckets
- **Domain-specific utilities**:
  - `src/lib/memberStorageUtils.js` - Member photos
  - `src/lib/newsStorageUtils.js` - News images
  - `src/lib/competitionStorageUtils.js` - Competition files
- **Error handling**: Automatic fallback to placeholder images on load failure

## Key Architectural Files

Understanding these files is essential for grasping the system architecture:

- **[src/App.jsx](src/App.jsx)** - Router configuration with 60+ lazy-loaded routes
- **[src/contexts/SupabaseAuthContext.jsx](src/contexts/SupabaseAuthContext.jsx)** - RBAC system with 6-level role hierarchy
- **[src/hooks/usePageAccess.js](src/hooks/usePageAccess.js)** - Dynamic permission checking logic
- **[src/lib/customSupabaseClient.js](src/lib/customSupabaseClient.js)** - Supabase client configuration
- **[src/config/performance.js](src/config/performance.js)** - Caching and performance settings

## Important Context

### Deployment & Configuration
- **Base path**: `/ALJ_Jonage_Escalade/` (GitHub Pages requirement)
- **Production URL**: https://lopezdav-code.github.io/ALJ_Jonage_Escalade/
- **Dev server**: Port 3000, full path `http://localhost:3000/ALJ_Jonage_Escalade/`
- **Node version**: 20.19.1 (see `.nvmrc`)

### Database
- **Provider**: Supabase (PostgreSQL)
- **Schema**: Exported to `schema.json` at root
- **SQL scripts**: Located in `sql/` directory for schema modifications
- **Migrations**: Tracked in `migrations/` directory

### Technology Choices
- **No TypeScript**: Uses `.jsx`/`.js` with JSDoc patterns for type hints
- **No global state library**: Pure React Context API
- **UI Framework**: Radix UI primitives + Tailwind CSS (shadcn/ui pattern)
- **Animation**: Framer Motion
- **Forms**: date-fns for date handling, controlled components pattern

### Documentation
Extensive French documentation in `docs/` directory:
- **Setup guides**: `docs/setup/` (deployment, GitHub, Cypress)
- **Feature guides**: `docs/` root (image management, cycles, passeports, roles)
- **Testing**: `docs/testing/` (testing guide, Cypress fixes)
- **Refactoring**: `docs/refactoring/` (refactoring plans and summaries)
- **Database**: Migration guides and optimization reports

## Testing

### E2E Testing with Cypress
- **Coverage**: 206 tests across 11 files (45%+ page coverage)
- **Configuration**: [cypress.config.cjs](cypress.config.cjs)
- **Test specs**: `cypress/e2e/**/*.cy.js`
- **Test categories**: Accessibility, Navigation, RBAC/Permissions, Content Validation, Admin Features, Interactions, Performance
- **CI/CD**: GitHub Actions workflows in `.github/workflows/`

### Running Tests
```bash
# All tests (headless)
npm test

# Interactive mode (recommended for development)
npm run test:e2e:ui

# Debug mode (headed browser, stays open)
npm run test:e2e:debug

# Single test file
npx cypress run --spec "cypress/e2e/admin/admin-dashboard.cy.js"

# Generate test reports
npm run test:report
```

## Code Splitting & Performance

Routes are lazy-loaded to optimize bundle size:
```javascript
const News = lazy(() => import('./pages/News'));
const Competitions = lazy(() => import('./pages/Competitions'));
// 60+ routes total...
```

All lazy-loaded components are wrapped in Suspense boundaries with a custom `LoadingScreen` component.

## Common Architectural Patterns

### Custom Hooks Pattern
Hooks encapsulate business logic and are used extensively:
- `usePageAccess()` - Permission checking
- `useNewsPermissions()` - Granular news CRUD permissions
- `useMemberImage()` - Image loading with error handling
- `useConnectionLogger()` - Activity logging
- `useRefreshMaterializedViews()` - Database view refresh

### Real-time Updates Pattern
Supabase channels for live data:
```javascript
const channel = supabase
  .channel('config-changes')
  .on('postgres_changes', { ... }, callback)
  .subscribe()
```

### Role-Based Rendering Pattern
Components check permissions at render time:
```javascript
const { hasAccess, isLoading } = usePageAccess('/admin-dashboard');

if (isLoading) return <LoadingScreen />;
if (!hasAccess) return <Navigate to="/" />;
```

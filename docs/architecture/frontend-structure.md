# Frontend Structure

The frontend is a **React 19 + TypeScript** single-page application built with Create React App and CRACO, styled with **Tailwind CSS** and **shadcn/ui** (Radix primitives).

## Directory layout

```
frontend/src/
├── App.tsx                 # Root router, lazy-loaded views
├── index.tsx               # React DOM entry
├── views/                  # Route-level pages
│   ├── admin/              # Studio OS screens
│   ├── customer/           # Account area
│   ├── policies/           # Legal pages
│   └── AppPermissionRoutes.tsx
├── components/
│   ├── layout/             # StorefrontLayout, AdminLayout
│   ├── CLAuth/             # hasPermission, CLAuth HOC
│   ├── SettingsComponents/ # PermissionMatrix, etc.
│   ├── ui/                 # shadcn components (Button, Table, …)
│   └── ProtectedRoute.tsx
├── contexts/
│   ├── AuthContext.tsx     # User session + permissions load
│   ├── CartContext.tsx     # Shopping cart state
│   └── ThemeContext.tsx    # Light/dark mode
├── common_assets/
│   ├── Constants/          # modules.ts, permissions.ts
│   ├── DataRepository/     # DAOs (AuthDao, RbacDao, …)
│   ├── URL/ApiUrl.ts       # API path constants
│   └── storage/CPStorage.ts # localStorage keys (nj_*)
├── lib/
│   ├── api.ts              # Legacy axios helper (some admin pages)
│   ├── brand.ts            # BRAND_NAME, BRAND_SHORT
│   ├── constants.ts        # Currency, formatting
│   └── rbacHelpers.ts      # Permission matrix utilities
└── types/index.ts          # Shared TypeScript types
```

## Routing

Defined in `App.tsx`:

| Layout | Routes |
|--------|--------|
| `StorefrontLayout` | Public + customer `/account/*` |
| `AdminLayout` | `/admin/*` (wrapped in `ProtectedRoute admin`) |

Routes are **lazy loaded** (`React.lazy`) for code splitting.

## Data access pattern (DAO)

API calls go through **DAOs** in `common_assets/DataRepository/`, not raw fetch in every component.

Example flow:

```
View → RbacDao.listRoles() → xhr (axios) → /api/roles/
```

The `xhr` client (`common_assets/DataRepository/core/WebApiCaller/xhr.ts`):

- Base URL: `REACT_APP_BACKEND_URL/api`
- Sends cookies (`withCredentials: true`)
- Injects `moduleID` and `l_id` headers from `CPStorage`
- Unwraps `{ success, data }` API envelope where used

## Permission gating (UI)

1. **Route map** — `AppPermissionRoutes.tsx` maps paths to `module_id` + required op.
2. **On navigation** — `ModuleRouteTracker` sets current module in storage for headers.
3. **Component gate** — `hasPermission(moduleId, CPPermissions.READ)` or `CLAuth` HOC.
4. **On login** — `fetchAndStorePermissions()` caches permissions in localStorage.

```tsx
// Hide button if user cannot create products
if (hasPermission(MODULES.PRODUCTS, CPPermissions.CREATE)) {
  return <Button>New product</Button>;
}
```

## State management

| Concern | Mechanism |
|---------|-----------|
| Auth user | `AuthContext` |
| Cart | `CartContext` (localStorage-backed) |
| Theme | `ThemeContext` + `localStorage` |
| Permissions | `CPStorage` + `RbacDao` |
| Page data | Local `useState` / `useEffect` (most admin pages) |

TanStack Query and SWR are installed; most views currently use direct API calls — new features may adopt React Query for caching.

## Styling conventions

- **Tailwind** utility classes
- **shadcn/ui** for forms, tables, dialogs
- Brand accent: orange (`bg-orange-600`)
- Admin sidebar: compact **NJ** logo; full name **New Journey** in copy
- Font classes: `font-display`, `font-mono-data` for numeric data

## Environment

Create `frontend/.env` for local dev:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

Production build on Vercel sets this in project environment variables.

## Adding a new frontend page

1. Create view under `views/` (admin or customer).
2. Add lazy import + `<Route>` in `App.tsx`.
3. Add nav link in `AdminLayout.tsx` if admin.
4. Map route in `AppPermissionRoutes.tsx`.
5. Gate sensitive UI with `hasPermission` or `CLAuth`.
6. Add DAO methods if new API surface.
7. Document in `docs/modules/`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server (port 3000) |
| `npm run build` | Production build (allows TS errors via env) |
| `npm run build:strict` | Fail build on TypeScript errors |
| `npm test` | Jest/CRA tests |

Install: `npm install --legacy-peer-deps` (peer dependency resolution for React 19).

# RBAC & Security

New Journey uses **role-based access control (RBAC)** with a **bitmask permission model** inherited from the CloudPathology platform. The same module IDs and permission bits exist on backend and frontend.

## Permission bits

| Flag | Value | Meaning |
|------|-------|---------|
| DELETE | 1 | Can delete resources |
| UPDATE | 2 | Can edit resources |
| READ | 4 | Can view |
| CREATE | 8 | Can create resources |
| HIDDEN | 16 | Field/section hidden in UI |

**Full CRUD** = `1 | 2 | 4 | 8` = **15**

### Check rule

```
(userBits & requiredBits) === requiredBits
```

Example: user has `READ | UPDATE` (6). Required `READ` (4) → `(6 & 4) === 4` ✓. Required `CREATE` (8) → fails.

## Module IDs

Each feature has a stable string ID, usually matching the admin or account route:

| Example module_id | Feature |
|-------------------|---------|
| `/admin/products` | Product management |
| `/admin/permissions` | Roles UI (mapped via `/admin/roles` in routes) |
| `/account/orders` | Customer order history |
| `/products` | Public catalog |

**Canonical list:** `packages/constants/modules.json`

**Synced copies:**

- Backend: `PrintForge.Constants/Modules.cs`
- Frontend: `frontend/src/common_assets/Constants/modules.ts`

## Roles vs user overrides

```
Effective permissions = Role permissions ∪ User overrides (overrides win per module)
```

| Concept | Storage | Managed via |
|---------|---------|-------------|
| **Role** | `roles` + `role_permissions` collections | Admin → Permissions → Roles tab |
| **User override** | `user_permissions` collection | Admin → Permissions → User overrides tab |
| **Legacy admin** | No role_id, `role === "admin"` | Full CRUD on all admin modules |

Default seeded roles: `admin`, `staff`, `customer` (via `SeedDataService`).

## API permission headers

Every authenticated API request should send:

| Header | Purpose |
|--------|---------|
| `moduleID` | Current UI module (from route) |
| `l_id` | Location/tenant context (default tenant for NJ) |

Set automatically by `xhr` interceptors from `CPStorage`.

## Backend enforcement

| Mechanism | When |
|-----------|------|
| `[UserAuthorize]` | Must be logged in |
| `[AdminAuthorize]` | Must be admin or staff |
| `PermissionMiddleware` | Fine-grained module + bit check (when configured) |
| `PermissionService.CheckPermissionAsync` | Service-level checks |

RBAC admin endpoints (`/api/roles/*`, `/api/users/permissions`) require `[AdminAuthorize]`.

## Frontend enforcement

| Mechanism | When |
|-----------|------|
| `ProtectedRoute` | Redirect unauthenticated users |
| `ProtectedRoute admin` | Block non-admin from `/admin` |
| `hasPermission()` | Hide buttons, sections |
| `CLAuth({ moduleID, OP })` | HOC — render null if denied |
| `CLFieldAuth` | Field-level bitmask (prefix `flds_`) |

Permissions cached in localStorage key `nj_user_permissions` after login.

## Admin Permissions UI

**Route:** `/admin/permissions` (aliases: `/admin/roles`, `/admin/users`)

| Tab | Function |
|-----|----------|
| Roles | Create/delete roles, edit permission matrix per module |
| User overrides | Pick user, set per-module overrides, clear overrides |

**Key files:**

- `views/admin/Permissions.tsx`
- `views/admin/permissions/RolesPanel.tsx`
- `views/admin/permissions/UserPermissionsPanel.tsx`
- `components/SettingsComponents/PermissionMatrix.tsx`
- `common_assets/DataRepository/RbacDao.ts`

After saving permissions, UI calls `POST /api/reloadPermissions` to bust server cache.

## Authentication

| Item | Detail |
|------|--------|
| Tokens | JWT access + refresh |
| Storage | HttpOnly cookies (not localStorage) |
| Cookie names | Defined in `BackendConstants` |
| Refresh | `POST /api/auth/refresh` |
| Password | Hashed in MongoDB (`password_hash` never returned in API) |

## Adding a new RBAC-protected module

1. Add entry to `packages/constants/modules.json`
2. Update `Modules.cs` and `frontend/.../modules.ts`
3. Seed module in `PermissionService.SeedRbacAsync()`
4. Add route to `AppPermissionRoutes.tsx`
5. Protect API with appropriate authorize attribute
6. Gate UI with `CLAuth` / `hasPermission`
7. Document in `docs/modules/`

## Security checklist for interns

- Never commit real `JwtSecret` or Mongo credentials
- Never expose `password_hash` in API responses
- Validate all admin actions server-side (UI hiding is not security)
- Use parameterized MongoDB filters (no string concatenation)
- Set restrictive `CorsOrigins` in production (not `*` with credentials)

# Admin — Permissions (Roles & Users)

**module_ids:** `/admin/roles`, `/admin/users`

## Purpose

Full RBAC management from the admin UI — define roles with module permission matrices and set per-user permission overrides.

## Routes

| Route | View | Tab |
|-------|------|-----|
| `/admin/permissions` | `views/admin/Permissions.tsx` | Default |
| `/admin/roles` | Same | Roles |
| `/admin/users` | Same | User overrides |

## UI structure

| Tab | Component | Function |
|-----|-----------|----------|
| Roles | `permissions/RolesPanel.tsx` | CRUD roles + permission matrix |
| User overrides | `permissions/UserPermissionsPanel.tsx` | Pick user, edit overrides |

Shared component: `components/SettingsComponents/PermissionMatrix.tsx`

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/modules/` | Module registry |
| GET | `/api/roles/` | Roles + permission maps |
| POST | `/api/roles/` | Create role |
| GET | `/api/roles/{id}` | Role detail |
| PATCH | `/api/roles/{id}` | Update metadata |
| DELETE | `/api/roles/{id}` | Delete (if no users assigned) |
| PUT | `/api/roles/{id}/permissions` | Save role matrix |
| GET | `/api/users/` | User list |
| GET | `/api/users/permissions?uuid=` | User effective + overrides + role baseline |
| PUT | `/api/users/permissions?uuid=` | Replace user overrides |
| POST | `/api/reloadPermissions` | Bust permission cache |

### Save payload format

```json
{
  "permissions": [
    { "module_id": "/admin/products", "permission_bits": 15 }
  ]
}
```

Permission bits: DELETE=1, UPDATE=2, READ=4, CREATE=8, HIDDEN=16.

## Key files

| Layer | Path |
|-------|------|
| Controller | `RbacController.cs` |
| Services | `RbacService`, `PermissionService` |
| DAO | `RbacDao.ts` |
| Helpers | `lib/rbacHelpers.ts` |
| Constants | `packages/constants/modules.json` |

## Permissions

Managing RBAC requires admin access. Module gate: `/admin/roles` (READ minimum).

## User overrides behavior

- Overrides **replace** stored user override rows
- Empty override matrix = inherit role permissions entirely
- **Clear overrides** sends empty `permissions` array
- Highlighted rows in UI = modules with active overrides

## Intern tasks

- Assign role to user from this UI (backend supports `role_id` on user — UI may need extension)
- Export role permission matrix as JSON

## Related

- [RBAC & security](../architecture/rbac-and-security.md)
- [Authentication](authentication.md)

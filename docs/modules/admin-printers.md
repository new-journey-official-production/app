# Admin — Printers

**module_id:** `/admin/printers`

## Purpose

Manage the 3D printer fleet: model, status, nozzle size, loaded filament, current job, total hours.

## Routes

| Route | View |
|-------|------|
| `/admin/printers` | `views/admin/Printers.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/printers` | List |
| POST | `/api/printers` | Create |
| PATCH | `/api/printers/{pid}` | Update |
| DELETE | `/api/printers/{pid}` | Delete |

## Key files

- `AdminControllers.cs` → `PrintersController`
- `PrinterRepository`, entity `Printer`
- `views/admin/Printers.tsx`

## Permissions

Full CRUD per standard admin bits.

## Intern tasks

- Status badge colors (idle / printing / maintenance)
- Link printer to current order (future enhancement)

## Related

- [Admin orders](admin-orders.md)
- [Admin inventory](admin-inventory.md)

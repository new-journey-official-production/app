# Admin — Inventory

**module_id:** `/admin/inventory`

## Purpose

Track filament, resin, and other print materials — quantities, reorder levels, suppliers, and unit costs.

## Routes

| Route | View |
|-------|------|
| `/admin/inventory` | `views/admin/Inventory.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/inventory` | List items |
| POST | `/api/inventory` | Create item |
| PATCH | `/api/inventory/{iid}` | Update |
| DELETE | `/api/inventory/{iid}` | Delete |

## Key files

- `AdminControllers.cs` → `InventoryController`
- `InventoryRepository`, entity `InventoryItem`
- `views/admin/Inventory.tsx`

## Permissions

| Action | Bit |
|--------|-----|
| View | READ |
| Add/edit | CREATE / UPDATE |
| Delete | DELETE |

## Intern tasks

- Highlight rows where `quantity <= reorder_level`
- Add sort by material type

## Related

- [Admin printers](admin-printers.md)

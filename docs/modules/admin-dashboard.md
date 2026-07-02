# Admin — Dashboard

**module_id:** `/admin`

## Purpose

Studio OS home — KPI overview, quick stats, and entry point for admin operations.

## Routes

| Route | View |
|-------|------|
| `/admin` | `views/admin/Dashboard.tsx` |

## API

Typically aggregates from:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/analytics/summary` | Summary metrics (may also power Analytics page) |
| GET | `/api/admin/orders` | Recent orders (if dashboard loads them) |

Check `Dashboard.tsx` for exact calls.

## Key files

- `frontend/src/views/admin/Dashboard.tsx`
- `frontend/src/components/layout/AdminLayout.tsx` — sidebar nav
- `backend/PrintForge.Services/` → `AnalyticsService`

## Permissions

| Action | Bit |
|--------|-----|
| View dashboard | READ (4) |

Default: all admin/staff roles with dashboard module access.

## Intern tasks

- Add a stat card (wire to existing analytics API)
- Improve empty state when no orders exist
- Fix responsive layout on mobile admin header

## Related

- [Admin analytics](admin-analytics.md)
- [Admin orders](admin-orders.md)

# Admin — Analytics

**module_id:** `/admin/analytics`

## Purpose

Business intelligence dashboard — revenue, order counts, trends for studio decision-making.

## Routes

| Route | View |
|-------|------|
| `/admin/analytics` | `views/admin/Analytics.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/analytics/summary` | KPI summary object |

Response shape is a dictionary computed in `AnalyticsService.GetSummaryAsync()` — open service for current metrics keys.

## Key files

- `AdminControllers.cs` → `AnalyticsController`
- `AnalyticsService`
- `views/admin/Analytics.tsx` (likely uses **recharts**)

## Permissions

| Action | Bit |
|--------|-----|
| View analytics | READ |

## Intern tasks

- Add date range selector (requires API extension)
- Document each chart's data source in code comments

## Related

- [Admin dashboard](admin-dashboard.md)

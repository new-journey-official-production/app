# Admin — Reviews

**module_id:** `/admin/reviews`

## Purpose

Moderate product reviews submitted by customers — approve, hide, or edit review visibility.

## Routes

| Route | View |
|-------|------|
| `/admin/reviews` | `views/admin/Reviews.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reviews` | Admin list all |
| PATCH | `/api/reviews/{rid}` | Moderate |
| POST | `/api/reviews` | Customer submit (public catalog) |

Creating a review recalculates product `rating_avg` and `rating_count`.

## Key files

- `CoreControllers.cs` → `ReviewsController`
- `ReviewRepository`, `ActivityLogService`
- `views/admin/Reviews.tsx`

## Permissions

| Action | Bit |
|--------|-----|
| View | READ |
| Moderate | UPDATE |

## Intern tasks

- Filter by approved/pending
- Show linked product name in table

## Related

- [Catalog](catalog.md)

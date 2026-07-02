# Customer — Account Dashboard

**module_id:** `/account`

## Purpose

Logged-in customer home — summary of recent orders, quick links to wishlist, profile, and support.

## Routes

| Route | View |
|-------|------|
| `/account` | `views/customer/Dashboard.tsx` |

Wrapped in `ProtectedRoute` and often `CustomerShell` layout components.

## API

Typically loads:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | User info |
| GET | `/api/orders` | Recent orders |

## Key files

- `views/customer/Dashboard.tsx`
- `views/customer/CustomerShell.tsx`
- `contexts/AuthContext.tsx`

## Permissions

| Action | Bit |
|--------|-----|
| View account | READ |

Customer role receives READ (and limited CRUD on sub-modules) via seeded RBAC.

## Intern tasks

- Empty state for new customers with no orders
- Quick link cards styling consistency

## Related

- [Customer orders](customer-orders.md)
- [Authentication](authentication.md)

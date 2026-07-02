# Admin — Customers

**module_id:** `/admin/customers`

## Purpose

View registered customer accounts with order count and lifetime spend — CRM-lite for the studio.

## Routes

| Route | View |
|-------|------|
| `/admin/customers` | `views/admin/Customers.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/customers` | List customers + aggregates |

Returns users with `role === "customer"`, enriched with `orders_count` and `lifetime_spend`.

## Key files

- `AdminControllers.cs` → `CustomersController`
- `UserRepository.FindCustomersAsync`
- `views/admin/Customers.tsx`

## Permissions

| Action | Bit |
|--------|-----|
| View customer list | READ |

## Intern tasks

- Add search/filter by email
- Link row to user permission overrides ([admin-permissions.md](admin-permissions.md))

## Related

- [User permissions UI](admin-permissions.md)
- [Customer account](customer-account.md)

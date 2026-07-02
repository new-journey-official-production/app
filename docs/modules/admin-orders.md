# Admin — Orders

**module_id:** `/admin/orders`

## Purpose

View and manage customer orders: filter by status, update fulfillment status, view timeline, edit order metadata.

## Routes

| Route | View |
|-------|------|
| `/admin/orders` | `views/admin/Orders.tsx` |
| `/admin/orders/:id` | `views/admin/OrderDetail.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/orders` | List (`status`, `q`, `limit`) |
| PATCH | `/api/admin/orders/{oid}/status` | Status + timeline entry |
| PATCH | `/api/admin/orders/{oid}` | General update |

Customer-facing:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders` | Create order (checkout) |
| GET | `/api/orders` | My orders |
| GET | `/api/orders/{oid}` | Order detail |

## Key files

- `OrderService`, `OrderRepository`
- `AdminControllers.cs` → `OrdersController`, `AdminOrdersController`
- `views/admin/Orders.tsx`, `OrderDetail.tsx`
- Order numbers prefixed **`NJ-`** (`BackendConstants.OrderNoPrefix`)

## Order statuses

Typical flow: `pending` → `confirmed` → `printing` → `shipped` → `delivered` (verify in entity/UI).

## Permissions

| Action | Bit |
|--------|-----|
| View orders | READ |
| Update status | UPDATE |

## Intern tasks

- Add status filter chips on orders list
- Format timeline dates consistently
- Export orders CSV (new feature — requires backend endpoint)

## Related

- [Checkout](checkout.md)
- [Customer orders](customer-orders.md)

# Customer — Orders

**module_id:** `/account/orders`

## Purpose

Customers view order history and order detail with status timeline.

## Routes

| Route | View |
|-------|------|
| `/account/orders` | `views/customer/Orders.tsx` |
| `/account/orders/:id` | `views/customer/OrderDetail.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/orders` | List my orders |
| GET | `/api/orders/{oid}` | Order detail (scoped to user) |

## Key files

- `OrderService.GetMyOrdersAsync`, `GetOrderAsync`
- Customer views above
- Order number format: **`NJ-*`**

## Permissions

| Action | Bit |
|--------|-----|
| View orders | READ |

## Intern tasks

- Status badge component shared with admin
- Print-friendly order summary

## Related

- [Checkout](checkout.md)
- [Admin orders](admin-orders.md)

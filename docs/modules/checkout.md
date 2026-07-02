# Checkout

**module_id:** `/checkout`

## Purpose

Authenticated checkout flow — cart review, shipping address, coupon application, payment placeholder, order placement.

## Routes

| Route | View | Access |
|-------|------|--------|
| `/checkout` | `views/Checkout.tsx` | `ProtectedRoute` (login required) |

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/orders` | Create order from cart payload |
| GET | `/api/addresses` | Saved addresses |
| GET | `/api/coupons/validate` | Apply coupon |
| GET | `/api/products/{slug}` | Validate line items (optional) |

## Key files

- `views/Checkout.tsx`
- `contexts/CartContext.tsx`
- `OrderService.CreateAsync`
- `OrdersController`

## Order creation flow

1. Cart items from client state
2. Select/create shipping address
3. Optional coupon validation
4. POST order → stock decrement, order doc, notifications
5. Redirect to order confirmation / account orders

## Permissions

| Action | Bit |
|--------|-----|
| Place order | CREATE |

## Intern tasks

- Order summary line item breakdown
- Better error when out of stock
- Loading state on submit button

## Related

- [Cart / Catalog](catalog.md)
- [Customer orders](customer-orders.md)
- [Admin coupons](admin-coupons.md)

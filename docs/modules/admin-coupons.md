# Admin — Coupons

**module_id:** `/admin/coupons`

## Purpose

Create discount coupons (percentage or flat amount), set minimum order, max discount cap, and active flag.

## Routes

| Route | View |
|-------|------|
| `/admin/coupons` | `views/admin/Coupons.tsx` |

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/coupons` | Admin | List |
| POST | `/api/coupons` | Admin | Create |
| DELETE | `/api/coupons/{cid}` | Admin | Delete |
| GET | `/api/coupons/validate` | Public | Validate at checkout |

## Key files

- `CoreControllers.cs` → `CouponsController`
- `CouponService`, `CouponRepository`
- `views/admin/Coupons.tsx`
- Checkout applies coupon via validate endpoint

## Coupon kinds

- `percent` — percentage off subtotal
- `flat` — fixed amount off

## Permissions

Admin CRUD; checkout validation is public (with valid code).

## Intern tasks

- Show usage count (requires backend field if not present)
- Edit existing coupon (PATCH — add if missing)

## Related

- [Checkout](checkout.md)

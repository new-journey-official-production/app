# Customer — Profile

**module_id:** `/account/profile`

## Purpose

Update account details — name, phone, avatar; manage shipping addresses.

## Routes

| Route | View |
|-------|------|
| `/account/profile` | `views/customer/Profile.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/api/auth/profile` | Update profile fields |
| GET | `/api/addresses` | List addresses |
| POST | `/api/addresses` | Add address |
| PATCH | `/api/addresses/{aid}` | Update |
| DELETE | `/api/addresses/{aid}` | Delete |

## Key files

- `AuthController` (profile)
- `AddressesController`
- `views/customer/Profile.tsx`

## Permissions

| Action | Bit |
|--------|-----|
| View profile | READ |
| Edit profile | UPDATE |

## Intern tasks

- Default address indicator
- Form validation for postal codes

## Related

- [Authentication](authentication.md)
- [Checkout](checkout.md) — uses saved addresses

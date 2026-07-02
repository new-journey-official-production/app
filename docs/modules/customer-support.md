# Customer — Support

**module_id:** `/account/support`

## Purpose

Customers open support tickets linked to orders and exchange messages with studio staff.

## Routes

| Route | View |
|-------|------|
| `/account/support` | `views/customer/Support.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/support/tickets` | My tickets |
| POST | `/api/support/tickets` | Create ticket |
| POST | `/api/support/tickets/{tid}/reply` | Add message |

## Key files

- `SupportController`
- `views/customer/Support.tsx`
- Admin side: [admin-support.md](admin-support.md)

## Permissions

| Action | Bit |
|--------|-----|
| View tickets | READ |
| Create / reply | CREATE / UPDATE |

## Intern tasks

- Attach order dropdown when creating ticket
- Real-time refresh or polling for new replies

## Related

- [Admin support](admin-support.md)

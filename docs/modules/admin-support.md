# Admin — Support

**module_id:** `/admin/support`

## Purpose

Manage customer support tickets — view all conversations, reply as admin, update ticket status.

## Routes

| Route | View |
|-------|------|
| `/admin/support` | `views/admin/Support.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/tickets` | All tickets |
| PATCH | `/api/admin/tickets/{tid}` | Update ticket |
| POST | `/api/support/tickets/{tid}/reply` | Reply (admin or customer) |

Customer creates tickets via [customer-support.md](customer-support.md).

## Key files

- `SupportController`, `AdminTicketsController`
- `TicketRepository`, entity `Ticket`
- `EmailService` — sends email on admin reply
- `views/admin/Support.tsx`

## Ticket statuses

`open`, `answered`, `closed` (verify in UI/entity).

## Permissions

| Action | Bit |
|--------|-----|
| View tickets | READ |
| Reply / update | UPDATE |

## Intern tasks

- Unread/open ticket count in admin nav badge
- Better thread UI for message history

## Related

- [Customer support](customer-support.md)

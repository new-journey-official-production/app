# Database (MongoDB)

New Journey uses **MongoDB** as the primary data store. Entity classes in `PrintForge.Models/Entities/` map to collections via `MongoDbContext`.

## Connection

Configured by `MongoUrl` + `DbName` (default database: `newjourney`).

Access pattern: **Repository classes** — never query MongoDB directly from controllers.

## Collections (logical)

| Collection | Entity | Purpose |
|------------|--------|---------|
| `users` | `User` | Accounts (admin, staff, customer) |
| `products` | `Product` | Catalog items |
| `categories` | `Category` | Product categories |
| `orders` | `Order` | Customer orders (`NJ-*` order numbers) |
| `reviews` | `Review` | Product reviews |
| `wishlist` | `WishlistItem` | Saved products per user |
| `addresses` | `Address` | Shipping addresses |
| `coupons` | `Coupon` | Discount codes |
| `inventory` | `InventoryItem` | Filament/material stock |
| `printers` | `Printer` | 3D printer fleet |
| `tickets` | `Ticket` | Support conversations |
| `notifications` | `Notification` | In-app notifications |
| `blog_posts` | `BlogPost` | Blog content |
| `media` | `MediaItem` | Uploaded files (binary in DB) |
| `activity_logs` | `ActivityLog` | Admin audit trail |
| `modules` | `ModuleEntity` | RBAC module registry |
| `roles` | `Role` | Named roles |
| `role_permissions` | `RolePermission` | Role → module → bits |
| `user_permissions` | `UserPermission` | Per-user overrides |
| `password_resets` | `PasswordReset` | Reset tokens |
| `payments` | `Payment` | Payment records |
| `email_logs` | `EmailLog` | Sent email audit |
| `newsletter` | (inline) | Newsletter signups |
| `contact_messages` | `ContactMessage` | Contact form submissions |

> Exact collection names are defined in `MongoDbContext` — verify there if adding features.

## ID format

- Document IDs: generated via `IdHelper.NewId()` (string ObjectId-style)
- Timestamps: ISO 8601 strings via `IdHelper.NowIso()`
- Product/order slugs: `IdHelper.Slugify()`

## Seed data

On API startup, `SeedDataService.SeedAsync()` runs:

| Data | Condition |
|------|-----------|
| Admin user | If not exists (`AdminEmail`) |
| Demo customer | If not exists |
| Categories, products, coupons | If collections empty |
| RBAC modules, roles, permissions | Via `PermissionService.SeedRbacAsync()` |
| Sample inventory, printers, blog | If empty |

**Reset local DB:** drop database `newjourney` in MongoDB Compass or `mongosh`, restart API.

## User document (simplified)

```json
{
  "id": "...",
  "email": "admin@newjourney.com",
  "name": "Admin",
  "role": "admin",
  "role_id": "...",
  "password_hash": "...",
  "created_at": "2026-01-01T00:00:00Z"
}
```

`password_hash` is **never** returned in API responses.

## Order document (simplified)

```json
{
  "id": "...",
  "order_no": "NJ-1001",
  "user_id": "...",
  "status": "pending",
  "items": [{ "product_id": "...", "qty": 1, "price": 499 }],
  "total": 499,
  "timeline": [{ "status": "pending", "at": "...", "note": "..." }]
}
```

## RBAC collections

**modules** — one row per feature (`module_id`, `name`, `metadata.group`)

**roles** — `admin`, `staff`, `customer` + custom roles

**role_permissions** — `{ role_id, module_id, permission_bits }`

**user_permissions** — overrides only; merged at runtime with role permissions

## Migrations

There is no EF migrations-style system. Schema is flexible (BSON documents).

Optional SQL seeds exist under `supabase/` for a future Postgres migration path — **production currently uses MongoDB only**.

## Backup recommendations

| Environment | Approach |
|-------------|----------|
| Atlas | Enable automated backups in cluster settings |
| Self-hosted | `mongodump` on schedule |
| Before schema changes | Export affected collections |

## Useful mongosh commands

```javascript
use newjourney
db.users.find({ role: "admin" })
db.products.countDocuments()
db.orders.find().sort({ created_at: -1 }).limit(5)
```

## Intern tips

- Use MongoDB Compass for visual browsing during development
- Don't hand-edit `password_hash` — use register/login or seed
- Index considerations: product slug, user email (check `MongoDbContext` index creation if present)

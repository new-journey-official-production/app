# REST API Reference

Base URL: `{REACT_APP_BACKEND_URL}/api`

**Auth legend:** Public | User | Admin

JSON bodies and responses use **snake_case** unless noted.

---

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | API info `{ name, version, status }` |
| GET | `/health` | Public | Health check `{ ok, time }` |

---

## Authentication (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register; sets auth cookies |
| POST | `/auth/login` | Public | Login; sets auth cookies |
| POST | `/auth/logout` | Public | Clears cookies |
| GET | `/auth/me` | User | Current user DTO |
| POST | `/auth/refresh` | Public | Refresh JWT from cookie |
| POST | `/auth/forgot-password` | Public | Send reset email (if configured) |
| POST | `/auth/reset-password` | Public | Reset with token |
| PATCH | `/auth/profile` | User | Update name, phone, avatar |

---

## Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | Public | List all categories |

---

## Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | Public | List with filters: `category`, `q`, `material`, `min_price`, `max_price`, `featured`, `sort`, `limit`, `skip` |
| GET | `/products/{slug}` | Public | Product detail by slug or id |
| POST | `/products` | Admin | Create product |
| PATCH | `/products/{pid}` | Admin | Partial update |
| DELETE | `/products/{pid}` | Admin | Delete product |
| GET | `/admin/products/export` | Admin | Download CSV |
| POST | `/admin/products/import` | Admin | Upload CSV (multipart) |

---

## Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reviews` | User | Submit product review |
| GET | `/reviews` | Admin | List all reviews |
| PATCH | `/reviews/{rid}` | Admin | Moderate (approve/hide) |

---

## Wishlist

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wishlist` | User | List wishlist products |
| POST | `/wishlist/{pid}` | User | Add product |
| DELETE | `/wishlist/{pid}` | User | Remove product |

---

## Addresses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/addresses` | User | List user addresses |
| POST | `/addresses` | User | Create address |
| PATCH | `/addresses/{aid}` | User | Update address |
| DELETE | `/addresses/{aid}` | User | Delete address |

---

## Coupons

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/coupons/validate?code=&subtotal=` | Public | Validate coupon for checkout |
| GET | `/coupons` | Admin | List coupons |
| POST | `/coupons` | Admin | Create coupon |
| DELETE | `/coupons/{cid}` | Admin | Delete coupon |

---

## Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | User | Place order (checkout) |
| GET | `/orders` | User | My orders |
| GET | `/orders/{oid}` | User | Order detail |
| GET | `/admin/orders` | Admin | List orders (`status`, `q`, `limit`) |
| PATCH | `/admin/orders/{oid}/status` | Admin | Update status + timeline |
| PATCH | `/admin/orders/{oid}` | Admin | General order update |

---

## Inventory

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/inventory` | Admin | List inventory items |
| POST | `/inventory` | Admin | Create item |
| PATCH | `/inventory/{iid}` | Admin | Update item |
| DELETE | `/inventory/{iid}` | Admin | Delete item |

---

## Printers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/printers` | Admin | List printers |
| POST | `/printers` | Admin | Add printer |
| PATCH | `/printers/{pid}` | Admin | Update printer |
| DELETE | `/printers/{pid}` | Admin | Delete printer |

---

## Customers (admin)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/customers` | Admin | List customers with `lifetime_spend`, `orders_count` |

---

## Support tickets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/support/tickets` | User | My tickets |
| POST | `/support/tickets` | User | Create ticket |
| POST | `/support/tickets/{tid}/reply` | User | Reply (customer or admin) |
| GET | `/admin/tickets` | Admin | All tickets |
| PATCH | `/admin/tickets/{tid}` | Admin | Update status/metadata |

---

## Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | User | List notifications |
| POST | `/notifications/{nid}/read` | User | Mark read |

---

## Blog

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/blog` | Public | Published posts (`limit`) |
| GET | `/blog/{slug}` | Public | Single post |
| POST | `/blog` | Admin | Create post |
| PATCH | `/blog/{bid}` | Admin | Update post |
| DELETE | `/blog/{bid}` | Admin | Delete post |

---

## Public forms

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/newsletter` | Public | Newsletter signup |
| POST | `/contact` | Public | Contact form message |

---

## Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/analytics/summary` | Admin | Dashboard KPIs |

---

## Media

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/media` | Admin | List media metadata |
| GET | `/admin/media/{mid}` | Public | Serve file binary |
| POST | `/admin/media/upload` | Admin | Upload (multipart) |
| DELETE | `/admin/media/{mid}` | Admin | Delete media |

---

## Activity logs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/activity-logs` | Admin | Audit log (`limit`, `action`) |

---

## RBAC

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/permissions/me` | User | My effective permissions |
| GET | `/users/` | Admin | List users for permission UI |
| GET | `/users/permissions?uuid=` | Admin | User permissions + overrides |
| PUT | `/users/permissions?uuid=` | Admin | Replace user overrides |
| GET | `/modules/` | Admin | List RBAC modules |
| GET | `/roles/` | Admin | List roles with permission maps |
| POST | `/roles/` | Admin | Create role |
| GET | `/roles/{roleId}` | Admin | Get role + permissions |
| PATCH | `/roles/{roleId}` | Admin | Update name/description |
| DELETE | `/roles/{roleId}` | Admin | Delete role (if unassigned) |
| PUT | `/roles/{roleId}/permissions` | Admin | Update role permission matrix |
| POST | `/reloadPermissions` | Public* | Invalidate permission cache |

\* Prefer calling after admin permission changes; protect in production if needed.

### Permission update body

```json
{
  "permissions": [
    { "module_id": "/admin/products", "permission_bits": 15 }
  ]
}
```

### Permission response shape (user)

```json
{
  "/admin/products": { "permission": 15, "moduleID": "/admin/products" }
}
```

---

## Common error responses

| Status | Body | Meaning |
|--------|------|---------|
| 400 | `{ "detail": "..." }` | Validation / business rule |
| 401 | `{ "detail": "..." }` | Not authenticated |
| 403 | `{ "detail": "Forbidden" }` | Insufficient permission |
| 404 | `{ "detail": "..." }` | Resource not found |

---

## Request headers

| Header | When | Purpose |
|--------|------|---------|
| `Cookie` | Authenticated calls | JWT access/refresh tokens |
| `moduleID` | RBAC-aware calls | Current UI module |
| `l_id` | Multi-tenant (optional) | Location/tenant id |
| `Content-Type` | JSON bodies | `application/json` |

See [RBAC & security](../architecture/rbac-and-security.md) for permission model details.

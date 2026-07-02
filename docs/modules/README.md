# Module Documentation Index

Each **module** corresponds to an RBAC `module_id` in `packages/constants/modules.json`. This table links business features to routes, code, and detailed docs.

## Module registry

| module_id | Name | Group | Route(s) | Doc |
|-----------|------|-------|----------|-----|
| `/admin` | Dashboard | admin | `/admin` | [admin-dashboard.md](admin-dashboard.md) |
| `/admin/products` | Products | admin | `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit` | [admin-products.md](admin-products.md) |
| `/admin/orders` | Orders | admin | `/admin/orders`, `/admin/orders/:id` | [admin-orders.md](admin-orders.md) |
| `/admin/inventory` | Inventory | admin | `/admin/inventory` | [admin-inventory.md](admin-inventory.md) |
| `/admin/printers` | Printers | admin | `/admin/printers` | [admin-printers.md](admin-printers.md) |
| `/admin/customers` | Customers | admin | `/admin/customers` | [admin-customers.md](admin-customers.md) |
| `/admin/support` | Support | admin | `/admin/support` | [admin-support.md](admin-support.md) |
| `/admin/reviews` | Reviews | admin | `/admin/reviews` | [admin-reviews.md](admin-reviews.md) |
| `/admin/blog` | Blog | admin | `/admin/blog` | [admin-blog.md](admin-blog.md) |
| `/admin/coupons` | Coupons | admin | `/admin/coupons` | [admin-coupons.md](admin-coupons.md) |
| `/admin/analytics` | Analytics | admin | `/admin/analytics` | [admin-analytics.md](admin-analytics.md) |
| `/admin/media` | Media | admin | `/admin/media` | [admin-media.md](admin-media.md) |
| `/admin/activity` | Activity Logs | admin | `/admin/activity` | [admin-activity-logs.md](admin-activity-logs.md) |
| `/admin/settings` | Settings | admin | `/admin/settings` | [admin-settings.md](admin-settings.md) |
| `/admin/roles` | Roles | admin | `/admin/permissions`, `/admin/roles` | [admin-permissions.md](admin-permissions.md) |
| `/admin/users` | Users | admin | `/admin/permissions`, `/admin/users` | [admin-permissions.md](admin-permissions.md) |
| `/account` | Account | customer | `/account` | [customer-account.md](customer-account.md) |
| `/account/orders` | My Orders | customer | `/account/orders`, `/account/orders/:id` | [customer-orders.md](customer-orders.md) |
| `/account/wishlist` | Wishlist | customer | `/account/wishlist` | [customer-wishlist.md](customer-wishlist.md) |
| `/account/profile` | Profile | customer | `/account/profile` | [customer-profile.md](customer-profile.md) |
| `/account/support` | Customer Support | customer | `/account/support` | [customer-support.md](customer-support.md) |
| `/checkout` | Checkout | customer | `/checkout` | [checkout.md](checkout.md) |
| `/` | Storefront | public | `/`, `/about`, `/contact`, … | [storefront.md](storefront.md) |
| `/products` | Catalog | public | `/products`, `/product/:slug` | [catalog.md](catalog.md) |

## Cross-cutting

| Feature | Doc |
|---------|-----|
| Login, register, password reset | [authentication.md](authentication.md) |

## Standard module doc sections

Each module file includes:

- **Purpose** — what the feature does for users
- **Routes & UI** — frontend entry points
- **API** — relevant endpoints
- **Key files** — where to edit code
- **Permissions** — required bits for actions
- **Intern tasks** — safe starter changes

## Sync requirement

When adding a module, update **all four**:

1. `packages/constants/modules.json`
2. `backend/PrintForge.Constants/Modules.cs`
3. `frontend/src/common_assets/Constants/modules.ts`
4. This folder + `AppPermissionRoutes.tsx`

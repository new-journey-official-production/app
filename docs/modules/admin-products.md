# Admin — Products

**module_id:** `/admin/products`

## Purpose

Manage the 3D print product catalog: create, edit, deactivate products; import/export CSV; set pricing, materials, images, and categories.

## Routes

| Route | View |
|-------|------|
| `/admin/products` | `views/admin/Products.tsx` |
| `/admin/products/new` | `views/admin/ProductForm.tsx` |
| `/admin/products/:id/edit` | `views/admin/ProductForm.tsx` |

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | Public | List (admin may use with filters) |
| GET | `/api/products/{slug}` | Public | Detail |
| POST | `/api/products` | Admin | Create |
| PATCH | `/api/products/{pid}` | Admin | Update |
| DELETE | `/api/products/{pid}` | Admin | Delete |
| GET | `/api/admin/products/export` | Admin | CSV export |
| POST | `/api/admin/products/import` | Admin | CSV import |

## Key files

| Layer | Path |
|-------|------|
| Controller | `CoreControllers.cs` → `ProductsController`, `AdminProductsController` |
| Service | `ProductService` |
| Repository | `ProductRepository` |
| Entity | `PrintForge.Models/Entities/Product` |
| Views | `Products.tsx`, `ProductForm.tsx` |
| Public catalog | `views/Products.tsx`, `views/ProductDetail.tsx` |

## Product fields (typical)

Name, slug, description, price, category, material, stock, images, tags, featured flag, active flag, rating aggregates.

## Permissions

| Action | Bit |
|--------|-----|
| View list | READ |
| Create | CREATE |
| Edit | UPDATE |
| Delete | DELETE |

## Intern tasks

- Add table column (e.g. stock status badge)
- Improve product form validation messages
- Link product image picker to [Media module](admin-media.md)

## Related

- [Catalog (public)](catalog.md)
- [Admin media](admin-media.md)

# Catalog (Products & Cart)

**module_id:** `/products`

## Purpose

Browse and search the product catalog, view product details, manage shopping cart before checkout.

## Routes

| Route | View |
|-------|------|
| `/products` | `views/Products.tsx` |
| `/products/category/:slug` | `views/Products.tsx` |
| `/product/:slug` | `views/ProductDetail.tsx` |
| `/cart` | `views/Cart.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List/filter/sort |
| GET | `/api/products/{slug}` | Product detail |
| GET | `/api/categories` | Category list |
| POST | `/api/reviews` | Submit review (logged in) |

Cart is **client-side** via `CartContext` (localStorage) until checkout.

## Key files

- `views/Products.tsx`, `ProductDetail.tsx`, `Cart.tsx`
- `contexts/CartContext.tsx`
- `ProductService`, `ProductsController`
- `CategoriesController`

## Query parameters (list)

`category`, `q`, `material`, `min_price`, `max_price`, `featured`, `sort`, `limit`, `skip`

## Permissions

| Action | Bit |
|--------|-----|
| Browse catalog | READ (public) |
| Add review | CREATE (authenticated) |

## Intern tasks

- Filter UI for material/price
- Related products section on detail page
- Cart persistence edge cases (clear on logout?)

## Related

- [Admin products](admin-products.md)
- [Checkout](checkout.md)
- [Wishlist](customer-wishlist.md)

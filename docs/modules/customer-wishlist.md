# Customer — Wishlist

**module_id:** `/account/wishlist`

## Purpose

Save products for later — add/remove from wishlist, view saved products.

## Routes

| Route | View |
|-------|------|
| `/account/wishlist` | `views/customer/Wishlist.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/wishlist` | List products |
| POST | `/api/wishlist/{pid}` | Add |
| DELETE | `/api/wishlist/{pid}` | Remove |

## Key files

- `CoreControllers.cs` → `WishlistController`
- `WishlistRepository`
- `views/customer/Wishlist.tsx`
- Product detail page — heart/save button

## Permissions

| Action | Bit |
|--------|-----|
| View wishlist | READ |
| Add/remove | CREATE / DELETE |

## Intern tasks

- Add to cart from wishlist row
- Empty wishlist illustration

## Related

- [Catalog](catalog.md)

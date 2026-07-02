# Storefront (Home & Marketing)

**module_id:** `/`

## Purpose

Public marketing and entry experience — hero, featured products, brand story, navigation to catalog and blog.

## Routes

| Route | View |
|-------|------|
| `/` | `views/Home.tsx` |
| `/about` | `views/About.tsx` |
| `/contact` | `views/Contact.tsx` |
| `/faq` | `views/FAQ.tsx` |
| `/privacy`, `/terms`, etc. | `views/policies/*` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products?featured=true` | Featured products |
| POST | `/api/newsletter` | Newsletter signup |
| POST | `/api/contact` | Contact form |

## Key files

- `views/Home.tsx`, `About.tsx`, `Contact.tsx`, `FAQ.tsx`
- `components/layout/StorefrontLayout.tsx`
- `lib/brand.ts` — BRAND_NAME, BRAND_SHORT (NJ)

## Permissions

Public READ — no login required.

## Intern tasks

- Update hero copy/images
- Wire contact form validation to API errors
- Accessibility pass on navigation

## Related

- [Catalog](catalog.md)
- [Authentication](authentication.md)

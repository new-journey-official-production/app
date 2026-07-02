# Admin — Blog

**module_id:** `/admin/blog`

## Purpose

Create and publish blog posts for the storefront — titles, slugs, excerpts, content, cover images, tags.

## Routes

| Route | View |
|-------|------|
| `/admin/blog` | `views/admin/Blog.tsx` |

Public:

| Route | View |
|-------|------|
| `/blog` | `views/Blog.tsx` |
| `/blog/:slug` | `views/BlogPost.tsx` |

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/blog` | Public | Published posts |
| GET | `/api/blog/{slug}` | Public | Single post |
| POST | `/api/blog` | Admin | Create |
| PATCH | `/api/blog/{bid}` | Admin | Update |
| DELETE | `/api/blog/{bid}` | Admin | Delete |

## Key files

- `AdminControllers.cs` → `BlogController`
- `BlogRepository`, entity `BlogPost`
- Admin + public views above

## Permissions

Standard CRUD bits for admin; public READ on storefront.

## Intern tasks

- Preview unpublished draft
- Markdown toolbar in editor (if plain textarea today)

## Related

- [Storefront](storefront.md)
- [Admin media](admin-media.md) for cover images

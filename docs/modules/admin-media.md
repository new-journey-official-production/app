# Admin — Media

**module_id:** `/admin/media`

## Purpose

Upload and manage media assets (product images, blog covers) stored in MongoDB. Serve files via API URL.

## Routes

| Route | View |
|-------|------|
| `/admin/media` | `views/admin/Media.tsx` |

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/media` | Admin | List metadata |
| GET | `/api/admin/media/{mid}` | Public | Binary file |
| POST | `/api/admin/media/upload` | Admin | Multipart upload |
| DELETE | `/api/admin/media/{mid}` | Admin | Delete |

## Key files

- `AdminControllers.cs` → `MediaController`
- `MediaService`, `MediaRepository`
- `views/admin/Media.tsx`

## URL pattern

Uploaded files referenced as `{BACKEND}/api/admin/media/{id}` in product/blog forms.

## Permissions

| Action | Bit |
|--------|-----|
| Browse library | READ |
| Upload | CREATE |
| Delete | DELETE |

## Intern tasks

- Image preview grid
- File size/type validation message improvements

## Related

- [Admin products](admin-products.md)
- [Admin blog](admin-blog.md)

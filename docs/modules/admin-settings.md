# Admin — Settings

**module_id:** `/admin/settings`

## Purpose

Studio configuration UI — store preferences, branding options, operational settings (content varies by implementation).

## Routes

| Route | View |
|-------|------|
| `/admin/settings` | `views/admin/Settings.tsx` |

## API

Check `Settings.tsx` for wired endpoints. May use generic admin PATCH routes or local-only preferences.

## Key files

- `views/admin/Settings.tsx`

## Permissions

| Action | Bit |
|--------|-----|
| View / edit settings | READ / UPDATE |

## Intern tasks

- Document which settings are persisted vs UI-only
- Connect setting to backend if stubbed

## Related

- [Environment variables](../tech/environment-variables.md) for server-side config

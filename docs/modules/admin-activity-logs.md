# Admin — Activity Logs

**module_id:** `/admin/activity`

## Purpose

Audit trail of admin actions (product changes, review moderation, media delete, etc.) for accountability.

## Routes

| Route | View |
|-------|------|
| `/admin/activity` | `views/admin/ActivityLogs.tsx` |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/activity-logs` | List logs (`limit`, `action` filter) |

## Key files

- `AdminControllers.cs` → `ActivityLogsController`
- `ActivityLogRepository`, `ActivityLogService`
- `views/admin/ActivityLogs.tsx`

Logs written via `ActivityLogService.LogAsync(user, action, entityId, metadata)`.

## Permissions

| Action | Bit |
|--------|-----|
| View logs | READ |

## Intern tasks

- Filter dropdown by action type
- Show admin user name prominently

## Related

- All admin write modules log activities when integrated

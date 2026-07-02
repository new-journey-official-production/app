# Authentication

Cross-cutting module for user registration, login, session management, and password recovery.

## Purpose

- Create customer accounts
- Authenticate users with email/password
- Maintain JWT session via HttpOnly cookies
- Support profile updates and password reset flow
- Load RBAC permissions after login

## Routes (UI)

| Route | View | Access |
|-------|------|--------|
| `/login` | `views/Login.tsx` | Public |
| `/register` | `views/Register.tsx` | Public |
| `/forgot-password` | `views/ForgotPassword.tsx` | Public |
| `/reset-password` | `views/ResetPassword.tsx` | Public (with token) |

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/refresh` | Refresh tokens |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Set new password |
| PATCH | `/api/auth/profile` | Update profile |

## Key files

| Layer | Path |
|-------|------|
| Controller | `backend/PrintForge.Api/Controllers/AuthController.cs` |
| Service | `backend/PrintForge.Services/` → `AuthService` |
| Repository | `UserRepository`, `PasswordResetRepository` |
| Frontend context | `frontend/src/contexts/AuthContext.tsx` |
| DAO | `frontend/src/common_assets/DataRepository/AuthDao.ts` |
| Route guard | `frontend/src/components/ProtectedRoute.tsx` |
| JWT | `backend/PrintForge.Infrastructure/Auth/JwtService.cs` |

## Session flow

1. Login success → API sets `access_token` + `refresh_token` cookies
2. `AuthContext` stores user in React state
3. `fetchAndStorePermissions()` loads RBAC into localStorage
4. Admin users redirect to `/admin`; customers to `/account` or previous page

## Roles

| role field | Typical access |
|------------|----------------|
| `admin` | Full admin panel |
| `staff` | Admin panel per role permissions |
| `customer` | Account + storefront |

## Permissions

Auth endpoints are mostly public or `[UserAuthorize]`. No module_id gate on login itself.

Profile update maps to customer module `/account/profile` for header context.

## Intern tasks

- Improve validation messages on register form
- Add loading states to login button
- Document password policy in UI (match backend rules in `AuthService`)

## Related docs

- [RBAC & security](../architecture/rbac-and-security.md)
- [Customer profile](customer-profile.md)

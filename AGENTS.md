# New Journey — Agent & Architecture Guidelines

> **Full documentation:** see [`docs/README.md`](docs/README.md) for architecture, tech stack, API reference, and per-module guides for interns.

## Stack

| Layer | Technology | Deploy |
|-------|------------|--------|
| Frontend | React 19 + TypeScript + CRA/CRACO + shadcn/ui | Vercel |
| Backend | .NET 10 ASP.NET Core Web API (CP layered architecture) | Render |
| Database | Supabase Postgres (Npgsql + Dapper) | — |

## Backend Structure (.NET / C#)

```
backend/
├── PrintForge.sln
├── PrintForge.Api/              # Entry — Controllers, Program.cs, Middleware wiring
├── PrintForge.Services/         # Business logic
│   └── Interfaces/
├── PrintForge.Repositories/     # MongoDB data access
│   └── Interfaces/
├── PrintForge.Models/           # Entities + DTOs
├── PrintForge.Constants/        # Modules.cs, Permissions.cs, BackendConstants.cs
└── PrintForge.Infrastructure/   # Auth, Database, Middleware, DI extensions
```

### Layer rules
- **Controllers** — HTTP only; validate input, call service, return response
- **Services** — business rules, orchestration (`IAuthService`, `IProductService`, etc.)
- **Repositories** — Postgres queries only via Dapper (`IUserRepository`, `IProductRepository`, etc.)
- **Models** — entities in `Entities/`, request/response in `DTOs/`
- **Constants** — module IDs, permission bits, shared enums (sync with frontend + `packages/constants/modules.json`)
- **Infrastructure** — JWT auth, PostgresDb, middleware, DI registration

## Frontend Structure (TypeScript)

```
frontend/src/
├── views/                       # Page-level routes
├── components/CLAuth/           # hasPermission, CLAuth HOC, CLFieldAuth
├── common_assets/               # Constants, DAOs, URL, storage, xhr
├── contexts/                    # Auth, Cart, Theme
├── types/                       # Shared TypeScript interfaces
└── views/AppPermissionRoutes.tsx
```

## Permission Model

- Bitmask CRUD: DELETE=1, UPDATE=2, READ=4, CREATE=8, HIDDEN=16
- Check: `(userBits & requiredBits) === requiredBits`
- Module IDs in `PrintForge.Constants/Modules.cs` and `frontend/src/common_assets/Constants/modules.ts`
- Every API call sends `moduleID` and `l_id` headers via xhr interceptor

## Adding a New Module

1. Add module_id to `packages/constants/modules.json`
2. Sync to `PrintForge.Constants/Modules.cs` and `frontend/.../modules.ts`
3. Seed via `PermissionService.SeedRbacAsync()` or `supabase/seed/modules.sql`
4. Map route in `views/AppPermissionRoutes.tsx`
5. Protect API with `[AdminAuthorize]` or custom permission attribute
6. Gate UI with `CLAuth({ moduleID, OP })`

## Environment

**Vercel:** `REACT_APP_BACKEND_URL`  
**Render / local:** `DatabaseUrl`, `JwtSecret`, `CorsOrigins`, admin/customer seed creds (see `backend/.env.example`)

## Run locally

```powershell
# Backend
cd app/backend
dotnet run --project PrintForge.Api

# Frontend
cd app/frontend
npm install --legacy-peer-deps
npm start
```

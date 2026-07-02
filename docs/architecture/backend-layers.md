# Backend Layers

The backend is a **.NET 10** solution split into six projects. Each layer has a single responsibility — interns should not put business logic in controllers or SQL/Mongo queries in services.

## Project map

```
PrintForge.Api
    └── references → Services, Infrastructure, Models, Constants

PrintForge.Services
    └── references → Repositories, Models, Constants, Infrastructure

PrintForge.Repositories
    └── references → Models, Infrastructure

PrintForge.Infrastructure
    └── references → Models, Constants, Repositories (MongoDbContext)

PrintForge.Models
    └── (no dependencies — pure entities/DTOs)

PrintForge.Constants
    └── (no dependencies — modules, permission bits)
```

## Layer responsibilities

### Controllers (`PrintForge.Api/Controllers/`)

| Rule | Detail |
|------|--------|
| HTTP only | Parse request, return status codes |
| No business logic | Delegate to `I*Service` |
| Auth attributes | `[UserAuthorize]`, `[AdminAuthorize]` |
| Thin | &lt; ~30 lines per action when possible |

**Controller files:**

| File | Responsibility |
|------|----------------|
| `AuthController.cs` | Register, login, logout, profile, password reset |
| `CoreControllers.cs` | Health, categories, products, reviews, wishlist, addresses, coupons |
| `AdminControllers.cs` | Orders, inventory, printers, customers, support, blog, analytics, media, activity |
| `RbacController.cs` | Roles, modules, user permissions |

### Services (`PrintForge.Services/`)

Business rules, orchestration, caching, email triggers.

| Service | Purpose |
|---------|---------|
| `AuthService` | Registration, login, password hashing, profile |
| `ProductService` | Catalog CRUD, CSV import/export |
| `OrderService` | Checkout, order lifecycle, admin updates |
| `CouponService` | Validation, admin coupon CRUD |
| `PermissionService` | Effective permissions, RBAC seed, cache |
| `RbacService` | Roles, modules, user override management |
| `AnalyticsService` | Dashboard aggregates |
| `MediaService` | File upload/storage |
| `SeedDataService` | Initial data on app start |
| `ActivityLogService` | Audit trail writes |
| `EmailService` | Transactional email (templates) |

Interfaces live in `PrintForge.Services/Interfaces/IServices.cs`.

### Repositories (`PrintForge.Repositories/`)

MongoDB queries only. One repository per aggregate (users, products, orders, etc.).

Interfaces: `PrintForge.Repositories/Interfaces/IRepositories.cs`  
Implementations: `RepositoriesPart1.cs`, `RepositoriesPart2.cs`

### Models (`PrintForge.Models/`)

| Folder | Contents |
|--------|----------|
| `Entities/` | MongoDB document classes (`User`, `Product`, `Order`, …) |
| `DTOs/` | Request/response shapes (`RegisterRequest`, `ProductRequest`, …) |
| Helpers | `UserMapper`, `BsonMapper`, `IdHelper` |

JSON serialization uses **snake_case** (configured in `Program.cs`).

### Constants (`PrintForge.Constants/`)

| File | Contents |
|------|----------|
| `Modules.cs` | All `module_id` strings + `AdminModules` array |
| `Permissions.cs` | `CPPermissions` enum (bit flags) |
| `BackendConstants.cs` | Brand strings, cookie names, order prefix `NJ-` |

**Must stay in sync** with `packages/constants/modules.json` and frontend `modules.ts`.

### Infrastructure (`PrintForge.Infrastructure/`)

| Area | Purpose |
|------|---------|
| `Database/MongoDbContext.cs` | Collection accessors |
| `Auth/JwtService.cs` | Token create/validate |
| `Middleware/ContextMiddleware.cs` | Load user into `HttpContext` |
| `Middleware/PermissionMiddleware.cs` | Optional module permission gate |
| `Authorization/` | `UserAuthorize`, `AdminAuthorize` filters |
| `Extensions/` | DI registration (`AddPrintForgeServices`) |
| `Configuration/AppSettings.cs` | Bound config model |

## Program.cs pipeline

```csharp
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ContextMiddleware>();
app.UseMiddleware<PermissionMiddleware>();
app.MapControllers();
// Seed on startup
```

## Adding a new backend feature (checklist)

1. Entity + DTO in `PrintForge.Models`
2. `I*Repository` + implementation
3. `I*Service` + implementation
4. Controller action with correct auth attribute
5. Register in DI extension if new service/repo
6. Add `module_id` to constants if RBAC-gated
7. Document in `docs/modules/` and `docs/api/rest-api-reference.md`

## Build & run

```powershell
cd app/backend
dotnet build PrintForge.Api/PrintForge.Api.csproj
dotnet run --project PrintForge.Api
```

Default config: `PrintForge.Api/appsettings.json` (overridden by env vars on Render).

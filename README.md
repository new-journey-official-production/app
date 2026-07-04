# New Journey Store

Production e-commerce platform for a 3D print studio — storefront, customer account, and admin studio OS.

| | |
|---|---|
| **Brand** | New Journey (NJ) |
| **Frontend** | React 19 + TypeScript → [Vercel](https://vercel.com) |
| **Backend** | .NET 10 Web API → [Render](https://render.com) |
| **Database** | MongoDB |

## Quick start (local)

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm (or Yarn 1.x)
- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (default `mongodb://localhost:27017`)

### 1. Backend

```powershell
cd backend
dotnet run --project PrintForge.Api
```

API runs at **http://localhost:5000** (or the port shown in the terminal). On first start, seed data creates demo users and sample catalog data.

### 2. Frontend

```powershell
cd frontend
npm install --legacy-peer-deps
```

Create `app/frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

```powershell
npm start
```

App runs at **http://localhost:3000**.

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@newjourney.com` | `Admin@12345` |
| Customer | `customer@newjourney.com` | `Customer@12345` |

Admin panel: **http://localhost:3000/admin**

## Repository layout

```
app/
├── backend/          # .NET API (PrintForge.* projects)
├── frontend/         # React SPA
├── packages/         # Shared constants (modules.json)
├── docs/             # Full project documentation
├── AGENTS.md         # AI/agent coding guidelines
└── README.md         # This file
```

## Documentation

All intern and production documentation lives in **[docs/](docs/README.md)**:

| Doc | Description |
|-----|-------------|
| [Architecture overview](docs/architecture/overview.md) | System design and request flow |
| [Backend layers](docs/architecture/backend-layers.md) | Controllers → Services → Repositories |
| [Frontend structure](docs/architecture/frontend-structure.md) | Views, DAOs, contexts, RBAC UI |
| [RBAC & security](docs/architecture/rbac-and-security.md) | Permissions, roles, auth |
| [Tech stack](docs/tech/stack-and-versions.md) | Libraries and versions |
| [Environment variables](docs/tech/environment-variables.md) | Config for local and production |
| [Deployment](docs/tech/deployment.md) | Vercel + Render setup |
| [Database](docs/tech/database.md) | MongoDB collections and seed |
| [API reference](docs/api/rest-api-reference.md) | All REST endpoints |
| [Intern onboarding](docs/onboarding/intern-guide.md) | Start here if you're new |
| [Module docs](docs/modules/README.md) | Per-feature documentation |

## Common commands

```powershell
# Backend build
dotnet build app/backend/PrintForge.Api/PrintForge.Api.csproj

# Frontend production build
cd app/frontend && npm run build

# Frontend strict TypeScript build (no TS errors allowed)
cd app/frontend && npm run build:strict
```

## Environment (summary)

**Backend** — see [environment-variables.md](docs/tech/environment-variables.md) and `backend/.env.example`:

- `MongoUrl`, `DbName`, `JwtSecret`, `CorsOrigins`
- `AdminEmail`, `AdminPassword` (seed)

**Frontend:**

- `REACT_APP_BACKEND_URL` — API base URL without `/api`

## Contributing

1. Read [intern onboarding](docs/onboarding/intern-guide.md) and [development workflow](docs/onboarding/development-workflow.md).
2. Follow patterns in [AGENTS.md](AGENTS.md).
3. When adding a feature module, update `packages/constants/modules.json` and sync backend + frontend constants (see [RBAC doc](docs/architecture/rbac-and-security.md)).

## License

Proprietary — New Journey / internal use.

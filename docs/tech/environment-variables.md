# Environment Variables

Configuration for local development and production deployments.

## Backend

Set via `PrintForge.Api/appsettings.json`, `appsettings.Development.json`, or **environment variables** (Render uses env vars — they override JSON).

Template: `backend/.env.example`

| Variable | Required | Default (local) | Description |
|----------|----------|-----------------|-------------|
| `MongoUrl` | Yes | `mongodb://localhost:27017` | MongoDB connection string |
| `DbName` | Yes | `newjourney` | Database name |
| `JwtSecret` | Yes | (see appsettings) | Signing key for JWT — **use 32+ random chars in production** |
| `CorsOrigins` | Yes | `http://localhost:3000,...` | Comma-separated allowed origins for CORS |
| `AdminEmail` | Seed | `admin@newjourney.com` | Initial admin user email |
| `AdminPassword` | Seed | `Admin@12345` | Initial admin password |
| `DemoCustomerEmail` | Seed | `customer@newjourney.com` | Demo customer email |
| `DemoCustomerPassword` | Seed | `Customer@12345` | Demo customer password |

### Local backend setup

**Option A — appsettings only**

Edit `PrintForge.Api/appsettings.json` (already has defaults for local Mongo).

**Option B — environment variables (PowerShell)**

```powershell
$env:MongoUrl = "mongodb://localhost:27017"
$env:DbName = "newjourney"
$env:JwtSecret = "local-dev-secret-at-least-32-characters"
$env:CorsOrigins = "http://localhost:3000"
dotnet run --project PrintForge.Api
```

### Render (production)

In Render dashboard → Web Service → Environment:

```
MongoUrl=mongodb+srv://user:pass@cluster.mongodb.net
DbName=newjourney
JwtSecret=<strong-random-secret>
CorsOrigins=https://your-app.vercel.app
AdminEmail=admin@yourdomain.com
AdminPassword=<secure-password>
```

## Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_BACKEND_URL` | Yes | API origin **without** `/api` (e.g. `https://api.example.com`) |
| `TSC_COMPILE_ON_ERROR` | Optional | Set `true` in production build to allow TS warnings (see `.env.production`) |

### Local frontend `.env`

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
```

> Use the port your `dotnet run` output shows if not 5000.

### Vercel (production)

Project Settings → Environment Variables:

```
REACT_APP_BACKEND_URL=https://your-render-service.onrender.com
```

Redeploy after changing env vars.

## CORS notes

- Local: include `http://localhost:3000` (and `5173` if using Vite elsewhere)
- Production: set exact Vercel URL — avoid `*` when using cookie credentials
- `withCredentials: true` on frontend requires explicit origins on backend

## Secrets — do not commit

| Never commit | Use instead |
|--------------|-------------|
| Production `JwtSecret` | Render env var |
| MongoDB Atlas password | Render env var |
| Real admin passwords | Secrets manager / env |

## Health check URLs

| URL | Expected |
|-----|----------|
| `{BACKEND}/api/health` | `{ "ok": true, "time": "..." }` |
| `{BACKEND}/api` | `{ "name": "New Journey API", "status": "ok" }` |

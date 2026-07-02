# Deployment

Production deployment uses **Vercel** (frontend) and **Render** (backend API) with **MongoDB Atlas** (recommended) or self-hosted MongoDB.

## Architecture

```
Users → Vercel (React SPA)
          ↓ HTTPS
        Render (.NET API)
          ↓
        MongoDB Atlas
```

## 1. MongoDB

1. Create cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create database user and note connection string.
3. Allow network access from Render IP (or `0.0.0.0/0` for simplicity in staging).
4. Database name: `newjourney` (or set `DbName` accordingly).

## 2. Backend on Render

1. New **Web Service** → connect Git repo.
2. **Root directory:** `app/backend` (or repo root if monorepo configured).
3. **Build command:**
   ```bash
   dotnet publish PrintForge.Api/PrintForge.Api.csproj -c Release -o out
   ```
4. **Start command:**
   ```bash
   ./out/PrintForge.Api
   ```
5. Set environment variables (see [environment-variables.md](environment-variables.md)).
6. Note public URL, e.g. `https://newjourney-api.onrender.com`.

### First deploy

- App runs `SeedDataService.SeedAsync()` on startup — creates admin, demo customer, sample products if collections empty.
- Verify: `GET https://your-api.onrender.com/api/health`

## 3. Frontend on Vercel

1. Import Git repo in [Vercel](https://vercel.com).
2. **Root directory:** `app` (where `frontend/vercel.json` lives) or adjust paths.
3. Config from `frontend/vercel.json`:
   - Build: `cd frontend && yarn install && yarn build`
   - Output: `frontend/build`
   - SPA rewrite: all routes → `index.html`
4. Environment variable:
   ```
   REACT_APP_BACKEND_URL=https://your-render-api.onrender.com
   ```
5. Deploy and test login + admin panel.

### npm instead of yarn

If yarn is unavailable in CI, override install/build:

```bash
cd frontend && npm install --legacy-peer-deps && npm run build
```

## 4. Post-deploy checklist

| Check | How |
|-------|-----|
| API health | Open `/api/health` |
| CORS | Login from Vercel URL — no CORS errors in console |
| Cookies | Login works; refresh survives page reload |
| Admin | `/admin` loads for admin user |
| Permissions | `/admin/permissions` loads roles matrix |
| Media | Upload image in admin media; URL loads |

## 5. Custom domain (optional)

| Service | Step |
|---------|------|
| Vercel | Add domain in project settings |
| Render | Add custom domain to web service |
| Update `CorsOrigins` | Include `https://yourdomain.com` |
| Update `REACT_APP_BACKEND_URL` | If API also on custom domain |

## Local vs production differences

| Aspect | Local | Production |
|--------|-------|------------|
| API URL | `http://localhost:5000` | Render HTTPS URL |
| MongoDB | localhost | Atlas connection string |
| JWT secret | Dev default | Strong random secret |
| HTTPS | Optional | Required for secure cookies |
| Seed data | Same seed service | Runs once on empty DB |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error on login | Add Vercel URL to `CorsOrigins` on Render |
| 401 on all API calls | Check cookies; ensure `REACT_APP_BACKEND_URL` matches Render URL |
| Empty catalog | Wait for seed; check MongoDB connection and `DbName` |
| Build fails on Vercel | Use `--legacy-peer-deps`; check Node version 18+ |
| Render sleep (free tier) | First request after idle may be slow (cold start) |

## CI/CD

No GitHub Actions workflow is included by default. Vercel and Render deploy on push to connected branch when configured in their dashboards.

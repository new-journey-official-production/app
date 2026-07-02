# Intern Onboarding Guide

Welcome to **New Journey Store**. This guide gets you from zero to a running local environment and your first safe code change.

## Day 1 checklist

- [ ] Clone the repository and open `app/` in your IDE
- [ ] Install Node 18+, .NET 10 SDK, MongoDB locally (or use Atlas)
- [ ] Read [Architecture overview](../architecture/overview.md) (15 min)
- [ ] Follow [Root README](../../README.md) to start backend + frontend
- [ ] Log in as admin and click through `/admin` and `/admin/permissions`
- [ ] Log in as customer and place a test order
- [ ] Read [Development workflow](development-workflow.md)

## What this product is

New Journey is a **3D print e-commerce store** with:

1. **Storefront** — browse products, cart, checkout, blog
2. **Customer account** — orders, wishlist, profile, support
3. **Admin Studio OS** — products, orders, inventory, printers, analytics, permissions

You're working on production code — follow review process and never commit secrets.

## Repo map (what to open first)

| Path | Why |
|------|-----|
| `README.md` | Run instructions |
| `docs/README.md` | Full documentation index |
| `frontend/src/App.tsx` | All routes |
| `backend/PrintForge.Api/Controllers/` | All API endpoints |
| `packages/constants/modules.json` | Feature/module list |
| `AGENTS.md` | Coding rules for humans and AI tools |

## Local setup (detailed)

### MongoDB

Start MongoDB locally or use a free Atlas cluster. Default connection:

```
mongodb://localhost:27017
Database: newjourney
```

### Backend terminal

```powershell
cd app/backend
dotnet run --project PrintForge.Api
```

Wait for "RBAC seed complete" or similar log. API should respond at `http://localhost:5000/api/health`.

### Frontend terminal

```powershell
cd app/frontend
npm install --legacy-peer-deps
```

Create `.env`:

```
REACT_APP_BACKEND_URL=http://localhost:5000
```

```powershell
npm start
```

Browser opens `http://localhost:3000`.

### Test logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@newjourney.com | Admin@12345 |
| Customer | customer@newjourney.com | Customer@12345 |

## How code is organized

**Backend:** Controller → Service → Repository → MongoDB  
**Frontend:** View → DAO (or api helper) → xhr → API

Don't skip layers — e.g. don't query MongoDB from a controller.

## Permissions (important)

Almost every admin screen is tied to a **module_id** like `/admin/products`. Access is controlled by bitmask permissions. Read [RBAC doc](../architecture/rbac-and-security.md) before building admin features.

## Your first task (suggested)

1. Pick a small UI fix (typo, label) on an admin page
2. Find the view in `frontend/src/views/admin/`
3. Make the change, verify in browser
4. Open PR with screenshot

Then try a read-only API trace: add a `console.log` in a DAO, call the endpoint, remove log before PR.

## Who to ask

| Topic | Look at |
|-------|---------|
| API contract | `docs/api/rest-api-reference.md` |
| Feature behavior | `docs/modules/<feature>.md` |
| Env / deploy issues | `docs/tech/environment-variables.md` |
| Architecture questions | `docs/architecture/overview.md` |

## Tools we use

- **VS Code / Cursor** — IDE
- **MongoDB Compass** — browse database
- **Browser DevTools** — Network tab for API debugging
- **Postman / curl** — optional API testing (remember cookies for auth)

## Code style reminders

- Match existing patterns in the file you're editing
- TypeScript on frontend; C# on backend
- No placeholder `TODO` commits — finish or don't merge
- Document new modules in `docs/modules/`

Next: [Development workflow](development-workflow.md)

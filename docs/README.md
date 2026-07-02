# New Journey — Documentation Index

Welcome to the **New Journey Store** documentation. This folder is the single source of truth for architecture, technology, APIs, and per-module behavior — written for software interns and production maintainers.

## Start here

| Audience | Read first |
|----------|------------|
| New intern | [Intern onboarding guide](onboarding/intern-guide.md) |
| Running locally | [Root README](../README.md) |
| Adding a feature | [Development workflow](onboarding/development-workflow.md) |
| Understanding permissions | [RBAC & security](architecture/rbac-and-security.md) |

## Architecture

| Document | Contents |
|----------|----------|
| [Overview](architecture/overview.md) | High-level system diagram, domains, deployment |
| [Backend layers](architecture/backend-layers.md) | .NET project structure, layer rules, DI |
| [Frontend structure](architecture/frontend-structure.md) | React app layout, routing, state, DAO pattern |
| [RBAC & security](architecture/rbac-and-security.md) | Auth, JWT cookies, permission bits, module IDs |
| [Data flow](architecture/data-flow.md) | Typical request paths (login, checkout, admin CRUD) |

## Technology

| Document | Contents |
|----------|----------|
| [Stack & versions](tech/stack-and-versions.md) | Frontend/backend libraries and runtime |
| [Environment variables](tech/environment-variables.md) | All config keys for local, Render, Vercel |
| [Deployment](tech/deployment.md) | Production deploy on Vercel + Render |
| [Database](tech/database.md) | MongoDB collections, seed data, naming |

## API

| Document | Contents |
|----------|----------|
| [REST API reference](api/rest-api-reference.md) | Every endpoint, auth requirements, notes |

## Modules (features)

Each module maps to a **module_id** used by RBAC. See [modules index](modules/README.md) for the full list.

### Admin (Studio OS)

| Module | Doc |
|--------|-----|
| Dashboard | [admin-dashboard.md](modules/admin-dashboard.md) |
| Products | [admin-products.md](modules/admin-products.md) |
| Orders | [admin-orders.md](modules/admin-orders.md) |
| Inventory | [admin-inventory.md](modules/admin-inventory.md) |
| Printers | [admin-printers.md](modules/admin-printers.md) |
| Customers | [admin-customers.md](modules/admin-customers.md) |
| Support | [admin-support.md](modules/admin-support.md) |
| Reviews | [admin-reviews.md](modules/admin-reviews.md) |
| Blog | [admin-blog.md](modules/admin-blog.md) |
| Coupons | [admin-coupons.md](modules/admin-coupons.md) |
| Analytics | [admin-analytics.md](modules/admin-analytics.md) |
| Media | [admin-media.md](modules/admin-media.md) |
| Activity logs | [admin-activity-logs.md](modules/admin-activity-logs.md) |
| Settings | [admin-settings.md](modules/admin-settings.md) |
| Permissions (roles/users) | [admin-permissions.md](modules/admin-permissions.md) |

### Customer account

| Module | Doc |
|--------|-----|
| Account dashboard | [customer-account.md](modules/customer-account.md) |
| My orders | [customer-orders.md](modules/customer-orders.md) |
| Wishlist | [customer-wishlist.md](modules/customer-wishlist.md) |
| Profile | [customer-profile.md](modules/customer-profile.md) |
| Support | [customer-support.md](modules/customer-support.md) |
| Checkout | [checkout.md](modules/checkout.md) |

### Public storefront

| Module | Doc |
|--------|-----|
| Storefront (home) | [storefront.md](modules/storefront.md) |
| Catalog | [catalog.md](modules/catalog.md) |

### Cross-cutting

| Module | Doc |
|--------|-----|
| Authentication | [authentication.md](modules/authentication.md) |

## Related files in repo

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Agent/AI coding rules (keep in sync with docs) |
| `packages/constants/modules.json` | Canonical module registry |
| `backend/.env.example` | Backend env template |
| `frontend/src/views/AppPermissionRoutes.tsx` | Route → module_id map |

## Keeping docs updated

When you ship a feature:

1. Add or update the matching file under `docs/modules/`.
2. Update [API reference](api/rest-api-reference.md) if endpoints changed.
3. Update `modules.json` + backend `Modules.cs` + frontend `modules.ts` if RBAC scope changed.

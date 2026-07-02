# Tech Stack & Versions

## Summary

| Layer | Technology | Version (approx.) |
|-------|------------|-------------------|
| Runtime (FE) | Node.js | 18+ |
| UI framework | React | 19.0.0 |
| Language (FE) | TypeScript | 5.4.5 |
| Build (FE) | CRA + CRACO | react-scripts 5.0.1 |
| Routing | react-router-dom | 7.15.0 |
| HTTP client | axios | 1.16.0 |
| UI components | shadcn/ui + Radix | various |
| Styling | Tailwind CSS | 3.4.17 |
| Charts | recharts | 3.6.0 |
| Toasts | sonner | 2.0.3 |
| Runtime (BE) | .NET | 10 |
| Web framework | ASP.NET Core | Web API |
| Database driver | MongoDB.Driver | (via Infrastructure) |
| Auth | JWT Bearer + cookies | Microsoft.AspNetCore.Authentication.JwtBearer |

## Frontend dependencies (key)

See full list in `frontend/package.json`.

| Package | Purpose |
|---------|---------|
| `@radix-ui/*` | Accessible primitives for shadcn |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Component styling utilities |
| `react-hook-form`, `zod` | Forms and validation |
| `framer-motion` | Animations on storefront |
| `lucide-react` | Icons |
| `@tanstack/react-query`, `swr` | Available for data fetching (partial adoption) |

## Backend projects

| Project | Target framework |
|---------|------------------|
| PrintForge.Api | net10.0 |
| PrintForge.Services | net10.0 |
| PrintForge.Repositories | net10.0 |
| PrintForge.Models | net10.0 |
| PrintForge.Constants | net10.0 |
| PrintForge.Infrastructure | net10.0 |

## Deployment platforms

| Service | Platform |
|---------|----------|
| Frontend static hosting | Vercel |
| API hosting | Render |
| Database | MongoDB (Atlas recommended for production) |

## Brand constants

Defined in `frontend/src/lib/brand.ts` and `PrintForge.Constants/BackendConstants.cs`:

| Constant | Value |
|----------|-------|
| Full name | New Journey |
| Short | NJ |
| Demo admin email | admin@newjourney.com |
| Order number prefix | NJ- |

## Internal naming vs brand

| Internal | User-facing |
|----------|-------------|
| PrintForge.Api | New Journey API |
| PrintForge.* namespaces | Keep when editing C# — rename is a separate refactor |
| DbName `newjourney` | MongoDB database name |

## Browser support

CRA `browserslist` — last 1 version of major browsers, >0.2% market share.

# PrintForge — 3D Printing Business Management Platform

## Original problem statement
Build a complete, production-ready 3D printing business management platform: e-commerce storefront + admin dashboard + inventory + orders + customer management + support + analytics + email/whatsapp automation ready + SEO + responsive + auth + JWT + role-based (Admin/Staff/Customer). Original spec targeted ASP.NET Core 9 + PostgreSQL + Supabase; user approved swap to the environment-supported **React + FastAPI + MongoDB** stack. Payments and emails are MOCKED with clear event hooks for later integration.

## User choices
- Tech: React + FastAPI + MongoDB (user approved swap).
- Payment: MOCKED, hooks in `PaymentService.charge()`.
- Email: MOCKED, hooks in `EmailService.send()`, logged to `email_log` collection.
- Auth: JWT httpOnly cookies (custom email/password).
- Scope: Everything in one shot.

## Architecture
- Backend: single `/app/backend/server.py` with FastAPI, motor async MongoDB. All routes prefixed `/api`.
- Frontend: CRA + craco, `@/` alias to `src`, Tailwind + shadcn/ui + Framer Motion + Recharts.
- Auth: bcrypt hashing, JWT access(12h)+refresh(30d) in httpOnly cookies. `require_user` and `require_admin` FastAPI dependencies. Admin auto-seeded from `.env`.
- Hooks-based extension points: `PaymentService`, `EmailService`, `WhatsAppService`, `dispatch_order_event`.

## User personas
1. **Guest shopper** — browses shop, adds to cart. Prompted to register at checkout.
2. **Registered customer** — orders, tracks status via 10-step timeline, manages addresses, wishlist, reviews, support tickets.
3. **Admin/Staff** — full dashboard: products, inventory, printers, orders (accept/reject/assign printer/status), customers, support, reviews, blog, coupons, analytics.

## Implemented (2026-02-01)
- Backend: 60+ REST endpoints across auth, products, categories, orders (with 10-status flow + timeline + auto stock deduction), reviews, wishlist, addresses, coupons, inventory, printers, customers, support tickets (customer + admin), notifications, blog (CRUD + public), newsletter, contact, analytics summary.
- Auth: register/login/logout/me/refresh/forgot-password/reset-password/profile-update.
- Seed data: 13 categories, 17 products across all categories, 3 blog posts, 2 coupons (WELCOME10 / FREESHIP), 4 printers, 8 inventory items, 1 admin + 1 demo customer.
- Frontend routes: 40+ pages (Home, Shop, Product detail with reviews & related, Cart, Checkout with coupons + GST + shipping, Login/Register/Forgot/Reset, Customer dashboard (Orders / OrderDetail with live timeline / Wishlist / Profile with address book / Support ticketing), About/Contact/FAQ/Blog/BlogPost, 4 policy pages, 404).
- Admin panel: Overview KPIs + revenue chart + top products + low stock alerts, Products CRUD (list + rich form), Orders list + status advancing + printer assignment + priority, Inventory CRUD with low-stock detection, Printers grid with live status control, Customers, Support inbox, Reviews moderation, Blog CRUD, Coupons CRUD, Analytics (area chart + pie + list), Settings.
- Design system: Outfit / Manrope / JetBrains Mono, zinc + orange accent, light/dark theme toggle persisted to localStorage, glassmorphism nav, grain overlay hero, animate-fade-up, framer-motion hero, recharts dashboards.

## Backlog (post 1st finish)
- P1: Real payment gateway integration (Stripe/Razorpay), real email provider (Resend/SendGrid), WhatsApp via Twilio.
- P1: STL upload for custom prints (needs Supabase-style object storage).
- P2: SEO metadata per product (JSON-LD, dynamic head), sitemap.xml, robots.txt endpoint.
- P2: Advanced analytics (sales heatmap, conversion funnel, cart abandonment, expenses/profit tracking, PDF/CSV export).
- P2: Bulk product import/export, media library, activity logs page.
- P2: Push notifications, real-time order updates.
- P3: Multi-language, multi-currency, 360° product view, 3D STL preview.

## Test credentials
See `/app/memory/test_credentials.md`.

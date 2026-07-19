/**
 * Route → moduleId map for navigation gating (CP AppPermissionRoutes pattern).
 */
import { MODULES } from "@/common_assets/Constants/modules";
import { CPPermissions } from "@/common_assets/Constants/permissions";
import type { ModuleRouteConfig } from "@/types";

export const ModulesMap: Record<string, ModuleRouteConfig> = {
  "/": { moduleId: MODULES.STOREFRONT, OP: CPPermissions.READ, public: true },
  "/products": { moduleId: MODULES.CATALOG, OP: CPPermissions.READ, public: true },
  "/cart": { moduleId: MODULES.CATALOG, OP: CPPermissions.READ, public: true },
  "/checkout": { moduleId: MODULES.CHECKOUT, OP: CPPermissions.CREATE },
  "/account": { moduleId: MODULES.ACCOUNT, OP: CPPermissions.READ },
  "/account/orders": { moduleId: MODULES.ACCOUNT_ORDERS, OP: CPPermissions.READ },
  "/account/wishlist": { moduleId: MODULES.ACCOUNT_WISHLIST, OP: CPPermissions.READ },
  "/account/profile": { moduleId: MODULES.ACCOUNT_PROFILE, OP: CPPermissions.READ },
  "/account/support": { moduleId: MODULES.ACCOUNT_SUPPORT, OP: CPPermissions.READ },
  "/admin": { moduleId: MODULES.DASHBOARD, OP: CPPermissions.READ },
  "/admin/products": { moduleId: MODULES.PRODUCTS, OP: CPPermissions.READ },
  "/admin/categories": { moduleId: MODULES.PRODUCTS, OP: CPPermissions.READ },
  "/admin/orders": { moduleId: MODULES.ORDERS, OP: CPPermissions.READ },
  "/admin/billing": { moduleId: MODULES.BILLING, OP: CPPermissions.READ },
  "/admin/inventory": { moduleId: MODULES.INVENTORY, OP: CPPermissions.READ },
  "/admin/printers": { moduleId: MODULES.PRINTERS, OP: CPPermissions.READ },
  "/admin/customers": { moduleId: MODULES.CUSTOMERS, OP: CPPermissions.READ },
  "/admin/support": { moduleId: MODULES.SUPPORT, OP: CPPermissions.READ },
  "/admin/reviews": { moduleId: MODULES.REVIEWS, OP: CPPermissions.READ },
  "/admin/blog": { moduleId: MODULES.BLOG, OP: CPPermissions.READ },
  "/admin/coupons": { moduleId: MODULES.COUPONS, OP: CPPermissions.READ },
  "/admin/analytics": { moduleId: MODULES.ANALYTICS, OP: CPPermissions.READ },
  "/admin/media": { moduleId: MODULES.MEDIA, OP: CPPermissions.READ },
  "/admin/activity": { moduleId: MODULES.ACTIVITY_LOGS, OP: CPPermissions.READ },
  "/admin/settings": { moduleId: MODULES.SETTINGS, OP: CPPermissions.READ },
  "/admin/permissions": { moduleId: MODULES.ROLES, OP: CPPermissions.READ },
  "/admin/roles": { moduleId: MODULES.ROLES, OP: CPPermissions.READ },
  "/admin/users": { moduleId: MODULES.USERS, OP: CPPermissions.READ },
  "/b2b": { moduleId: MODULES.B2B_PORTAL, OP: CPPermissions.READ, public: true },
  "/admin/b2b": { moduleId: MODULES.B2B_DASHBOARD, OP: CPPermissions.READ },
  "/admin/b2b/categories": { moduleId: MODULES.B2B_CATEGORIES, OP: CPPermissions.READ },
  "/admin/b2b/products": { moduleId: MODULES.B2B_PRODUCTS, OP: CPPermissions.READ },
  "/admin/b2b/catalog": { moduleId: MODULES.B2B_CATALOG, OP: CPPermissions.READ },
  "/admin/b2b/quotes": { moduleId: MODULES.B2B_QUOTES, OP: CPPermissions.READ },
  "/admin/b2b/dealers": { moduleId: MODULES.B2B_DEALERS, OP: CPPermissions.READ },
  "/admin/b2b/analytics": { moduleId: MODULES.B2B_ANALYTICS, OP: CPPermissions.READ },
  "/admin/b2b/settings": { moduleId: MODULES.B2B_SETTINGS, OP: CPPermissions.READ },
};

/** Resolve module config for a path (exact or prefix match for nested routes). */
export function getModuleForPath(pathname: string): ModuleRouteConfig | null {
  if (ModulesMap[pathname]) return ModulesMap[pathname];
  const match = Object.keys(ModulesMap)
    .filter((p) => p !== "/" && pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ModulesMap[match] : null;
}

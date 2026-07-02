/** New Journey module IDs — sync with backend Modules.cs and supabase/seed/modules.sql */
export const MODULES = {
  DASHBOARD: "/admin",
  PRODUCTS: "/admin/products",
  ORDERS: "/admin/orders",
  INVENTORY: "/admin/inventory",
  PRINTERS: "/admin/printers",
  CUSTOMERS: "/admin/customers",
  SUPPORT: "/admin/support",
  REVIEWS: "/admin/reviews",
  BLOG: "/admin/blog",
  COUPONS: "/admin/coupons",
  ANALYTICS: "/admin/analytics",
  MEDIA: "/admin/media",
  ACTIVITY_LOGS: "/admin/activity",
  SETTINGS: "/admin/settings",
  ROLES: "/admin/roles",
  USERS: "/admin/users",
  ACCOUNT: "/account",
  ACCOUNT_ORDERS: "/account/orders",
  ACCOUNT_WISHLIST: "/account/wishlist",
  ACCOUNT_PROFILE: "/account/profile",
  ACCOUNT_SUPPORT: "/account/support",
  CHECKOUT: "/checkout",
  STOREFRONT: "/",
  CATALOG: "/products",
} as const;

export type ModuleId = (typeof MODULES)[keyof typeof MODULES];

export const FIELD_PREFIX = "flds_";

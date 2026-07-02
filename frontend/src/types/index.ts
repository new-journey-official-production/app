/** Shared domain and API types for New Journey frontend. */

/** Loose API document — use for list/detail state until strict DTOs per endpoint. */
export type ApiRow = Record<string, any>;

export type UserRole = "admin" | "staff" | "customer" | string;

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  role_id?: string;
  phone?: string;
  avatar?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discount_price?: number | null;
  images?: string[];
  material?: string;
  category?: string;
  stock?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  image?: string;
  price: number;
  quantity: number;
  variant: string | null;
  material?: string;
}

export interface CartTotals {
  subtotal: number;
  shipping: number;
  gst: number;
  total: number;
  count: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string | null;
}

export type OrderStatus =
  | "placed"
  | "payment_received"
  | "accepted"
  | "printing_scheduled"
  | "printing_started"
  | "quality_inspection"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | string;

export interface Order {
  id: string;
  user_id?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal?: number;
  shipping?: number;
  gst?: number;
  total: number;
  created_at?: string;
  updated_at?: string;
  shipping_address?: Record<string, unknown>;
}

/** CP-style API envelope: { status, result } */
export interface ApiResponse<T = unknown> {
  status: "success" | "error" | string;
  result?: T;
  message?: string;
  detail?: string | ValidationErrorDetail[] | Record<string, unknown>;
}

export interface ValidationErrorDetail {
  msg?: string;
  loc?: (string | number)[];
  type?: string;
}

/** Module permission entry — bitmask or object wrapper from RBAC API. */
export interface PermissionEntry {
  permission: number;
}

export type PermissionValue = number | PermissionEntry;

/** moduleId → permission bits */
export type PermissionDict = Record<string, PermissionValue>;

/** RBAC API — permission matrix row for PUT payloads. */
export interface PermissionMatrixItem {
  module_id: string;
  permission_bits: number;
}

export interface RbacModule {
  module_id: string;
  name: string;
  description?: string;
  metadata?: { group?: string; [key: string]: unknown };
}

export interface RbacRole {
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissions?: Record<string, number>;
  created_at?: string;
}

export interface UserPermissionsPayload {
  user: User;
  permissions: PermissionDict;
  overrides?: Record<string, number>;
  role_permissions?: Record<string, number>;
}

export interface ModuleRouteConfig {
  moduleId: string;
  OP: number;
  public?: boolean;
}

export type ThemeMode = "light" | "dark";

export interface Category {
  name: string;
  slug: string;
  icon: string;
}

export interface StatusMeta {
  color: string;
}

export interface OrderStatusStep {
  key: string;
  label: string;
}

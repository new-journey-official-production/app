import type { Category, OrderStatusStep, StatusMeta } from "@/types";

export const CATEGORIES: Category[] = [
  { name: "Kitchen", slug: "kitchen", icon: "utensils" },
  { name: "Home Utility", slug: "home-utility", icon: "home" },
  { name: "Office", slug: "office", icon: "briefcase" },
  { name: "Education", slug: "education", icon: "graduation-cap" },
  { name: "Farming", slug: "farming", icon: "sprout" },
  { name: "Decoration", slug: "decoration", icon: "sparkles" },
  { name: "Religious", slug: "religious", icon: "hand-heart" },
  { name: "Automotive", slug: "automotive", icon: "car" },
  { name: "Mobile Accessories", slug: "mobile-accessories", icon: "smartphone" },
  { name: "Gaming", slug: "gaming", icon: "gamepad-2" },
  { name: "Gifts", slug: "gifts", icon: "gift" },
  { name: "Custom Prints", slug: "custom-prints", icon: "wand-2" },
  { name: "Accessories", slug: "accessories", icon: "package" },
];

export const MATERIALS: string[] = ["PLA", "PETG", "ABS", "TPU", "Resin"];

export const ORDER_STATUS_STEPS: OrderStatusStep[] = [
  { key: "placed", label: "Order Placed" },
  { key: "payment_received", label: "Payment Received" },
  { key: "accepted", label: "Accepted" },
  { key: "printing_scheduled", label: "Printing Scheduled" },
  { key: "printing_started", label: "Printing Started" },
  { key: "quality_inspection", label: "Quality Inspection" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out For Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

export const STATUS_META: Record<string, StatusMeta> = {
  placed: { color: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" },
  payment_received: { color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  accepted: { color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" },
  printing_scheduled: { color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  printing_started: { color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  quality_inspection: { color: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  packed: { color: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  shipped: { color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300" },
  out_for_delivery: { color: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  delivered: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  completed: { color: "bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200" },
  cancelled: { color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
  pending: { color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  verification_pending: { color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  approved: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  rejected: { color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
};

/** Uses "Rs." — JetBrains Mono renders the ₹ glyph as a stray "1" in UI and PDFs. */
export function formatCurrency(n: number | string | null | undefined): string {
  const amount = Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return `Rs. ${amount}`;
}

/** Storefront product detail path — falls back to id when slug is missing. */
export function productPath(product: { slug?: string; id?: string; product_id?: string }): string {
  const key = product.slug?.trim() || product.id || product.product_id;
  return key ? `/product/${key}` : "/products";
}

export function statusLabel(k: string | null | undefined): string {
  return (k || "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

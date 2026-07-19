import React from "react";
import AdminPagination from "./AdminPagination";

export interface PaginationState {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  total: number;
  from: number;
  to: number;
}

interface AdminPaginatedPanelProps {
  children: React.ReactNode;
  pagination: PaginationState;
  className?: string;
  /** Viewport-relative max height for the scroll region */
  maxHeight?: string;
}

/**
 * Admin list shell — entries scroll inside the card; pagination stays fixed at the bottom.
 */
export default function AdminPaginatedPanel({
  children,
  pagination,
  className = "",
  maxHeight = "calc(100vh - 12rem)",
}: AdminPaginatedPanelProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-card flex flex-col overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {children}
      </div>
      <AdminPagination {...pagination} onPageChange={pagination.setPage} />
    </div>
  );
}

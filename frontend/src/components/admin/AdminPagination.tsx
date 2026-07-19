import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
}

/** Shared pagination bar for admin list panels (25 entries per page). */
export default function AdminPagination({ page, totalPages, total, from, to, onPageChange }: AdminPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card text-sm z-10 shadow-[0_-1px_0_0_hsl(var(--border))]">
      <div className="text-muted-foreground text-xs">
        Showing {from}–{to} of {total}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="text-xs font-mono-data tabular-nums px-2">
          {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 gap-1"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

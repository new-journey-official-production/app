import { useEffect, useMemo, useState } from "react";

/** Default page size for admin list panels. */
export const ADMIN_PAGE_SIZE = 25;

/**
 * Client-side pagination for admin tables.
 * Resets to page 1 when `items` length or `resetKey` changes.
 */
export function usePagination<T>(items: T[], pageSize = ADMIN_PAGE_SIZE, resetKey: unknown = items.length) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const slice = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    setPage,
    totalPages,
    pageSize,
    total,
    slice,
    from: total === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, total),
  };
}

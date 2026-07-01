import React from "react";
import { STATUS_META, statusLabel } from "@/lib/constants";

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.placed;
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${meta.color}`}
    >
      {statusLabel(status)}
    </span>
  );
}

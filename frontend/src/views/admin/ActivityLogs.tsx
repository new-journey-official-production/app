import React, { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ACTION_LABEL: Record<string, { label: string; color: string }> = {
  "product.create": { label: "Product created", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  "product.update": { label: "Product updated", color: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
  "product.delete": { label: "Product deleted", color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
  "order.status": { label: "Order status updated", color: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  "review.moderate": { label: "Review moderated", color: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
  "media.upload": { label: "Media uploaded", color: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300" },
  "media.delete": { label: "Media deleted", color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
  "products.import": { label: "Products imported (CSV)", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300" },
};

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState<ApiRow[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filter !== "all") params.action = filter;
    api.get("/admin/activity-logs", { params }).then((r) => setLogs(r.data));
  }, [filter]);

  const actions = useMemo(() => Object.keys(ACTION_LABEL), []);

  return (
    <div className="p-6 lg:p-8" data-testid="admin-activity-logs">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Activity logs</h1>
          <div className="text-sm text-muted-foreground">{logs.length} recent events across admin actions</div>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[240px]" data-testid="activity-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {actions.map((a) => <SelectItem key={a} value={a}>{ACTION_LABEL[a].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">
          <Activity className="h-6 w-6 mx-auto mb-2" />
          No activity yet. Actions from admins will show up here as they happen.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <ol className="divide-y divide-border">
            {logs.map((l) => {
              const meta = ACTION_LABEL[l.action] || { label: l.action, color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800" };
              return (
                <li key={l.id} className="flex items-start gap-4 p-4 hover:bg-accent/50 transition" data-testid={`activity-${l.id}`}>
                  <div className="flex-none pt-0.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-semibold">{l.user_name || l.user_email}</span>
                      <span className="text-muted-foreground"> · target </span>
                      <span className="font-mono-data text-xs">{l.target}</span>
                    </div>
                    {l.meta && Object.keys(l.meta).length > 0 && (
                      <div className="mt-1 text-xs text-muted-foreground font-mono-data truncate">{JSON.stringify(l.meta)}</div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono-data whitespace-nowrap">
                    {l.created_at?.slice(0, 16).replace("T", " ")}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}

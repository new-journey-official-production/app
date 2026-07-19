import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Edit } from "lucide-react";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import AdminPaginatedPanel from "@/components/admin/AdminPaginatedPanel";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminSupport() {
  const [tickets, setTickets] = useState<ApiRow[]>([]);
  const [active, setActive] = useState<ApiRow | null>(null);
  const [reply, setReply] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  const load = () => api.get("/admin/tickets").then((r) => setTickets(r.data));
  useEffect(() => { load(); }, []);

  const pagination = usePagination(tickets, 25, tickets.length);

  const send = async () => {
    if (!reply.trim() || !active) return;
    try {
      const { data } = await api.post(`/support/tickets/${active.id}/reply`, { message: reply });
      setActive(data);
      setReply("");
      load();
    } catch (err) { toast.error(apiError(err)); }
  };

  const setStatus = async (status) => {
    if (!active) return;
    await api.patch(`/admin/tickets/${active.id}`, { status });
    setActive({ ...active, status });
    load();
  };

  const saveSubject = async (e) => {
    e.preventDefault();
    if (!active) return;
    try {
      await api.patch(`/admin/tickets/${active.id}`, { subject: editSubject });
      setActive({ ...active, subject: editSubject });
      setEditOpen(false);
      load();
      toast.success("Subject updated");
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Support</h1>
      <div className="text-sm text-muted-foreground mb-6">{tickets.length} tickets</div>

      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        <AdminPaginatedPanel pagination={pagination} maxHeight="70vh">
          <div className="space-y-2 p-2">
          {pagination.slice.map((t) => (
            <button key={t.id} onClick={() => setActive(t)} className={`w-full text-left rounded-xl border p-4 transition ${active?.id === t.id ? "border-zinc-950 dark:border-white bg-accent" : "border-border hover:bg-accent"}`} data-testid={`admin-ticket-${t.id}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium truncate text-sm">{t.subject}</div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">{t.status}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{t.user_email}</div>
              <div className="text-[10px] text-muted-foreground mt-1 font-mono-data">{t.updated_at?.slice(0, 16).replace("T", " ")}</div>
            </button>
          ))}
          {tickets.length === 0 && <div className="text-sm text-muted-foreground p-6 text-center">No tickets yet</div>}
          </div>
        </AdminPaginatedPanel>

        <div className="rounded-xl border border-border bg-card p-6 min-h-[400px]">
          {active ? (
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-display font-semibold text-lg">{active.subject}</div>
                  <div className="text-xs text-muted-foreground">{active.user_email} · {active.user_name} {active.order_no ? `· Order ${active.order_no}` : ""}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => { setEditSubject(active.subject || ""); setEditOpen(true); }}><Edit className="h-3.5 w-3.5" /> Edit</Button>
                  <Button size="sm" variant={active.status === "open" ? "default" : "outline"} onClick={() => setStatus("open")}>Open</Button>
                  <Button size="sm" variant={active.status === "answered" ? "default" : "outline"} onClick={() => setStatus("answered")}>Answered</Button>
                  <Button size="sm" variant={active.status === "closed" ? "default" : "outline"} onClick={() => setStatus("closed")}>Closed</Button>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {active.messages.map((m, i) => (
                  <div key={i} className={`rounded-xl p-3 text-sm ${m.from === "admin" ? "bg-orange-50 dark:bg-orange-950/40" : "bg-accent"}`}>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.from} · <span className="font-mono-data">{m.at?.slice(0, 16).replace("T", " ")}</span></div>
                    <div className="mt-1 whitespace-pre-line">{m.message}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply…" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
                <Button onClick={send} className="bg-orange-600 hover:bg-orange-700">Reply</Button>
              </div>
            </div>
          ) : <div className="text-sm text-muted-foreground">Select a ticket to view the conversation.</div>}
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit ticket subject</DialogTitle></DialogHeader>
          <form onSubmit={saveSubject} className="space-y-3">
            <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required />
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

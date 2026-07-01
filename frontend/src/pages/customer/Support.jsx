import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import CustomerShell from "./CustomerShell";
import { api, apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function CustomerSupport() {
  const [tickets, setTickets] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ subject: "", order_no: "", message: "" });
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState("");

  const load = () => api.get("/support/tickets").then((r) => setTickets(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/support/tickets", f);
      toast.success("Ticket submitted");
      setOpen(false); setF({ subject: "", order_no: "", message: "" });
      load();
    } catch (err) { toast.error(apiError(err)); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !active) return;
    try {
      const { data } = await api.post(`/support/tickets/${active.id}/reply`, { message: reply });
      setActive(data);
      setReply("");
      load();
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <CustomerShell>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight">Support</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-ticket-btn">New ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Open a support ticket</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <input required placeholder="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="ticket-subject" />
              <input placeholder="Order number (optional)" value={f.order_no} onChange={(e) => setF({ ...f, order_no: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea required rows={4} placeholder="How can we help?" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="ticket-message" />
              <Button type="submit" className="w-full" data-testid="ticket-submit">Submit</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">No tickets yet.</div>
      ) : (
        <div className="mt-6 grid md:grid-cols-[1fr_1.4fr] gap-6" data-testid="tickets-list">
          <div className="space-y-2">
            {tickets.map((t) => (
              <button key={t.id} onClick={() => setActive(t)} className={`w-full text-left rounded-xl border p-4 transition ${active?.id === t.id ? "border-zinc-950 dark:border-white" : "border-border hover:bg-accent"}`} data-testid={`ticket-${t.id}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{t.subject}</div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-mono-data">{t.updated_at?.slice(0, 16).replace("T", " ")}</div>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-border p-6 min-h-[300px]">
            {active ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-display font-semibold text-lg">{active.subject}</div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{active.status}</span>
                </div>
                {active.order_no && <div className="text-xs text-muted-foreground font-mono-data mt-1">Order {active.order_no}</div>}
                <div className="mt-4 space-y-3">
                  {active.messages.map((m, i) => (
                    <div key={i} className={`rounded-xl p-3 text-sm ${m.from === "admin" ? "bg-orange-50 dark:bg-orange-950/40" : "bg-accent"}`}>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.from} · <span className="font-mono-data">{m.at?.slice(11, 16)}</span></div>
                      <div className="mt-1 whitespace-pre-line">{m.message}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply…" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="ticket-reply-input" />
                  <Button onClick={sendReply} data-testid="ticket-reply-btn">Send</Button>
                </div>
              </div>
            ) : <div className="text-muted-foreground text-sm">Select a ticket to view the conversation.</div>}
          </div>
        </div>
      )}
    </CustomerShell>
  );
}

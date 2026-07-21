import React, { useMemo } from "react";
import { Check, Circle } from "lucide-react";
import { ORDER_STATUS_STEPS, statusLabel } from "@/lib/constants";
import { paymentStatusLabel } from "@/lib/upi";
import type { OrderStatus } from "@/types";

interface TimelineEntry {
  status: string;
  at?: string;
  note?: string;
}

interface OrderTimelineProps {
  status: OrderStatus;
  timeline?: TimelineEntry[];
  paymentStatus?: string | null;
}

/** Customer-facing tracking steps including payment verification funnel. */
const PAYMENT_TRACK_STEPS = [
  { key: "order_created", label: "Order Created" },
  { key: "payment_pending", label: "Payment Pending" },
  { key: "verification_pending", label: "Payment Verification Pending" },
  { key: "payment_approved", label: "Payment Approved" },
  { key: "production_started", label: "Production Started" },
  { key: "dispatched", label: "Dispatched" },
  { key: "delivered", label: "Delivered" },
];

function resolveTrackIndex(orderStatus: string, paymentStatus?: string | null): number {
  const pay = (paymentStatus || "").toLowerCase();
  if (orderStatus === "cancelled" || pay === "rejected") return -1;
  if (["delivered", "completed"].includes(orderStatus)) return 6;
  if (["shipped", "out_for_delivery", "packed"].includes(orderStatus)) return 5;
  if (["accepted", "printing_scheduled", "printing_started", "quality_inspection"].includes(orderStatus)) return 4;
  if (pay === "approved" || pay === "paid" || orderStatus === "payment_received") return 3;
  if (pay === "verification_pending") return 2;
  if (pay === "pending" || orderStatus === "placed") return 1;
  return 0;
}

export default function OrderTimeline({ status, timeline = [], paymentStatus }: OrderTimelineProps) {
  const cancelled = status === "cancelled" || paymentStatus === "rejected";
  const byKey = Object.fromEntries(timeline.map((t) => [t.status, t]));
  const trackIndex = useMemo(() => resolveTrackIndex(status, paymentStatus), [status, paymentStatus]);

  // Prefer the payment-aware customer track when payment info is available.
  if (paymentStatus != null) {
    return (
      <div data-testid="order-timeline" className="relative">
        <div className="absolute top-3 left-3 bottom-3 w-px bg-border" />
        <div className="space-y-4">
          {cancelled ? (
            <div className="relative pl-10">
              <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white">
                <Check className="h-3 w-3" />
              </div>
              <div className="font-semibold text-red-600">
                {paymentStatus === "rejected" ? "Payment Failed" : "Cancelled"}
              </div>
              <div className="text-xs text-muted-foreground">
                {paymentStatus === "rejected"
                  ? paymentStatusLabel(paymentStatus)
                  : byKey.cancelled?.at?.slice(0, 16).replace("T", " ")}
              </div>
              {byKey.cancelled?.note && <div className="text-xs text-muted-foreground mt-0.5">{byKey.cancelled.note}</div>}
            </div>
          ) : (
            PAYMENT_TRACK_STEPS.map((step, i) => {
              const done = i <= trackIndex;
              const active = i === trackIndex;
              return (
                <div key={step.key} className="relative pl-10">
                  <div
                    className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border ${
                      done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-background border-border text-muted-foreground"
                    } ${active ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-background" : ""}`}
                  >
                    {done ? <Check className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                  </div>
                  <div className={`font-medium text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_STEPS.findIndex((s) => s.key === status);

  return (
    <div data-testid="order-timeline" className="relative">
      <div className="absolute top-3 left-3 bottom-3 w-px bg-border" />
      <div className="space-y-4">
        {cancelled ? (
          <div className="relative pl-10">
            <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white">
              <Check className="h-3 w-3" />
            </div>
            <div className="font-semibold text-red-600">Cancelled</div>
            <div className="text-xs text-muted-foreground">
              {byKey.cancelled?.at?.slice(0, 16).replace("T", " ")}
            </div>
          </div>
        ) : (
          ORDER_STATUS_STEPS.map((step, i) => {
            const done = i <= currentIndex;
            const active = i === currentIndex;
            const entry = byKey[step.key];
            return (
              <div key={step.key} className="relative pl-10">
                <div
                  className={`absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border ${
                    done
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "bg-background border-border text-muted-foreground"
                  } ${active ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-background" : ""}`}
                >
                  {done ? <Check className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                </div>
                <div className={`font-medium text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                  {statusLabel(step.key)}
                </div>
                {entry?.at && (
                  <div className="text-xs text-muted-foreground font-mono-data">
                    {entry.at.slice(0, 16).replace("T", " ")}
                  </div>
                )}
                {entry?.note && <div className="text-xs text-muted-foreground mt-0.5">{entry.note}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

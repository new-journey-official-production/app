import QRCode from "qrcode";

/** Builds a Bharat UPI deep-link for dynamic amount QR codes. */
export function buildUpiPayUrl(params: {
  upiId: string;
  merchantName: string;
  amount: number;
  orderNo: string;
}): string {
  const am = Number(params.amount || 0).toFixed(2).replace(/\.00$/, "");
  const tn = `Order-${params.orderNo}`;
  const qs = new URLSearchParams({
    pa: params.upiId,
    pn: params.merchantName,
    am,
    cu: "INR",
    tn,
  });
  return `upi://pay?${qs.toString()}`;
}

/** Renders a UPI URL to a PNG data URL for on-screen QR display. */
export async function generateUpiQrDataUrl(upiUrl: string, size = 280): Promise<string> {
  return QRCode.toDataURL(upiUrl, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#0a0a0a", light: "#ffffff" },
  });
}

export const PAYMENT_STATUSES = [
  "pending",
  "verification_pending",
  "approved",
  "rejected",
  "paid",
  "failed",
  "refunded",
] as const;

export const REJECTION_REASONS = [
  "Payment Not Received",
  "Wrong Amount",
  "Invalid Screenshot",
  "Transaction Failed",
] as const;

export function paymentStatusLabel(status?: string | null): string {
  const map: Record<string, string> = {
    pending: "Payment Pending",
    verification_pending: "Verification Pending",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
  };
  return map[(status || "").toLowerCase()] || (status || "—");
}

import React from "react";
import PolicyPage from "./PolicyPage";

export default function RefundPolicy() {
  return (
    <PolicyPage title="Refund Policy">
      <h3>Defects and damage</h3>
      <p>Report any manufacturing defect or shipping damage within 7 days of delivery — we'll replace or refund immediately.</p>
      <h3>Cancellations</h3>
      <p>Orders can be cancelled for a full refund up to the moment printing begins. Once a printer is running, we can't refund the print itself but we can cancel remaining line items.</p>
      <h3>Custom prints</h3>
      <p>Custom prints are non-refundable unless the fault is with the print quality itself. Please review your STL carefully before uploading.</p>
    </PolicyPage>
  );
}

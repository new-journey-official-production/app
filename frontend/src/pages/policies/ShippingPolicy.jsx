import React from "react";
import PolicyPage from "./PolicyPage";

export default function ShippingPolicy() {
  return (
    <PolicyPage title="Shipping Policy">
      <h3>Where we ship</h3>
      <p>Currently within India only. International shipping is in the works.</p>
      <h3>How long it takes</h3>
      <p>Studio turnaround is 24–48 hours. Delivery is 2–5 additional days for metros, 4–7 for other cities.</p>
      <h3>Cost</h3>
      <p>Flat ₹79 shipping, or free on orders above ₹999.</p>
      <h3>Tracking</h3>
      <p>Every order gets a live tracking link via email and inside your account.</p>
    </PolicyPage>
  );
}

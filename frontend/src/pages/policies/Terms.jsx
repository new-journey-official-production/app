import React from "react";
import PolicyPage from "./PolicyPage";

export default function Terms() {
  return (
    <PolicyPage title="Terms of Service">
      <p>By using PrintForge you agree to the following terms.</p>
      <h3>Orders</h3>
      <p>All prints are made-to-order. Once printing has started, orders cannot be cancelled.</p>
      <h3>Pricing</h3>
      <p>Prices are in INR and inclusive of 18% GST. We reserve the right to change pricing without notice.</p>
      <h3>Intellectual property</h3>
      <p>When you upload an STL for a custom print, you warrant that you own or have permission to reproduce it.</p>
      <h3>Liability</h3>
      <p>Our liability is limited to the value of the order. We're not responsible for indirect or consequential losses.</p>
    </PolicyPage>
  );
}

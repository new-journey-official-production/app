import React from "react";
import PolicyPage from "./PolicyPage";

export default function PrivacyPolicy() {
  return (
    <PolicyPage title="Privacy Policy">
      <p>We take your privacy seriously. This policy explains what we collect, why, and how we keep it safe.</p>
      <h3>What we collect</h3>
      <p>Name, email, shipping address, phone number, and order history. That's it.</p>
      <h3>How we use it</h3>
      <p>To fulfil your orders, send you updates about them, and answer support tickets. We never sell your data to third parties.</p>
      <h3>Cookies</h3>
      <p>We use a single httpOnly session cookie to keep you signed in. No advertising cookies, no tracking pixels.</p>
      <h3>Contact</h3>
      <p>Questions? Email <a href="mailto:privacy@printforge.com" className="underline">privacy@printforge.com</a>.</p>
    </PolicyPage>
  );
}

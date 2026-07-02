import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { BRAND_EMAIL_HELLO } from "@/lib/brand";

const FAQS = [
  { q: "How long does an order take?", a: "Most catalog items ship within 2–3 business days. Custom prints depend on complexity — we'll quote a timeline before printing begins." },
  { q: "Which materials do you offer?", a: "PLA (most colors), PETG (for outdoor/food-adjacent use), TPU (flexible), ABS (industrial), and standard-grey Resin for high-detail models." },
  { q: "Can I send my own STL?", a: "Absolutely — that's what 'Custom Prints' is for. Upload the file on the custom print product page and we'll quote it within an hour during work hours." },
  { q: "Do you ship internationally?", a: "Right now, only within India. We're working on international shipping — join the newsletter and you'll be the first to know." },
  { q: "What's your return policy?", a: "Any defect, dimensional issue or shipping damage is replaced free within 7 days of delivery. Because prints are made-to-order, we don't accept 'change of mind' returns." },
  { q: "Do you offer bulk discounts?", a: `Yes — email ${BRAND_EMAIL_HELLO} with quantities and we'll get back within a day.` },
  { q: "How do you protect prints in shipping?", a: "Every piece is bubble-wrapped and packed in double-walled boxes with foam corners. We haven't lost a print to shipping damage in eight months." },
  { q: "Are your plastics food-safe?", a: "PETG is food-contact safe. PLA is generally considered non-toxic but not officially food-safe for hot/wet contact." },
];

export default function FAQ() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-xs uppercase tracking-[0.3em] text-orange-600 font-semibold">FAQ</div>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight">Answers, quickly.</h1>
      <p className="mt-4 text-muted-foreground">Have another question? <a href="/contact" className="text-foreground underline underline-offset-4">Get in touch.</a></p>
      <Accordion type="single" collapsible className="mt-10" data-testid="faq-accordion">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="text-left font-semibold" data-testid={`faq-trigger-${i}`}>{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

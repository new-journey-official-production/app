import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export default function About() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-xs uppercase tracking-[0.3em] text-orange-600 font-semibold">About {BRAND_NAME}</div>
          <h1 className="mt-4 font-display text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] text-balance">
            A small studio, quietly manufacturing thousands of thoughtful objects a month.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {BRAND_NAME} started in a garage in 2022 with one Prusa MK3 and a stubborn belief that useful objects shouldn't have to travel across oceans to reach you. Four years and eight printers later, we still believe that.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <img src="https://images.unsplash.com/photo-1642969164999-979483e21601?w=900" alt="" className="rounded-3xl aspect-[4/5] object-cover" />
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Our philosophy</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            We only stock things we'd own ourselves. Every product on the site has been through our own homes for at least a month before we'd offer it to you. It's a slower way to build a catalog — but it means we can actually stand behind everything on it.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Additive manufacturing is a tool. It doesn't replace craftsmanship — it just lets a very small team produce very useful things without a factory.
          </p>
        </div>
      </section>

      <section className="bg-zinc-50 dark:bg-zinc-900/40 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-4 gap-8">
          {[
            { n: "12.4k", l: "Prints shipped" },
            { n: "8", l: "Printers in the studio" },
            { n: "48h", l: "Median turnaround" },
            { n: "4.9★", l: "Customer rating" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-mono-data text-4xl font-bold">{s.n}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Come make something.</h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Whether it's a single custom part or a batch of 200 giveaways, we'd love to hear about it.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/contact"><Button className="rounded-full bg-zinc-950 dark:bg-white dark:text-zinc-950">Get in touch</Button></Link>
          <Link to="/products"><Button variant="outline" className="rounded-full">Browse the shop</Button></Link>
        </div>
      </section>
    </div>
  );
}

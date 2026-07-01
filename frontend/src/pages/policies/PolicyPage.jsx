import React from "react";

export default function PolicyPage({ title, children }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-xs uppercase tracking-[0.3em] text-orange-600 font-semibold">Policy</div>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight">{title}</h1>
      <div className="mt-10 space-y-6 text-muted-foreground leading-relaxed prose max-w-none dark:prose-invert">{children}</div>
    </div>
  );
}

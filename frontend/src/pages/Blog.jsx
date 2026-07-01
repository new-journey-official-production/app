import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { api.get("/blog").then((r) => setPosts(r.data)); }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-xs uppercase tracking-[0.3em] text-orange-600 font-semibold">Journal</div>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight">Notes from the studio.</h1>
      <p className="mt-4 text-muted-foreground max-w-xl">Field guides, material deep-dives, and behind-the-scenes updates.</p>
      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="blog-grid">
        {posts.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="group rounded-2xl border border-border overflow-hidden bg-card hover:-translate-y-1 hover:shadow-xl transition-all" data-testid={`blog-card-${p.slug}`}>
            <div className="aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              {p.cover_image && <img src={p.cover_image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />}
            </div>
            <div className="p-5">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.tags?.join(" · ")}</div>
              <div className="mt-2 font-display font-semibold text-lg leading-snug">{p.title}</div>
              <div className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</div>
              <div className="mt-4 text-xs text-muted-foreground font-mono-data">{p.created_at?.slice(0, 10)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

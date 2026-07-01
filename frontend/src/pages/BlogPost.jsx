import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => { api.get(`/blog/${slug}`).then((r) => setPost(r.data)).catch(() => {}); }, [slug]);

  if (!post) return <div className="mx-auto max-w-3xl px-4 py-24"><div className="h-96 rounded-2xl shimmer" /></div>;

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
      <Link to="/blog" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3 w-3" /> Back to journal</Link>
      <div className="text-xs uppercase tracking-widest text-muted-foreground mt-6 font-mono-data">{post.created_at?.slice(0, 10)}</div>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-balance" data-testid="blog-title">{post.title}</h1>
      {post.cover_image && (
        <img src={post.cover_image} alt="" className="mt-8 w-full aspect-video object-cover rounded-3xl" />
      )}
      <div className="mt-10 prose prose-lg max-w-none dark:prose-invert whitespace-pre-line text-muted-foreground leading-relaxed">
        {post.content}
      </div>
    </article>
  );
}

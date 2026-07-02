import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-center">
      <div>
        <div className="font-mono-data text-8xl font-bold text-orange-600">404</div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">This layer didn't print.</h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">The page you're looking for doesn't exist — or has been retired.</p>
        <Link to="/" className="mt-8 inline-block"><Button className="rounded-full">Back to home</Button></Link>
      </div>
    </div>
  );
}

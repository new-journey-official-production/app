import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Heart, User, LifeBuoy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LINKS = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/account/orders", label: "Orders", icon: ShoppingBag },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/profile", label: "Profile", icon: User },
  { to: "/account/support", label: "Support", icon: LifeBuoy },
];

export default function CustomerShell({ children }) {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-[220px_1fr] gap-8">
      <aside>
        <div className="rounded-2xl border border-border p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Signed in</div>
          <div className="mt-1 font-semibold truncate">{user?.name}</div>
          <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
        </div>
        <nav className="mt-4 space-y-0.5" data-testid="account-nav">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} data-testid={`account-nav-${l.label.toLowerCase()}`} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? "bg-accent text-foreground font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <l.icon className="h-4 w-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}

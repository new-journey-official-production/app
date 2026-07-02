import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Search, Menu, Sun, Moon, X, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CATEGORIES } from "@/lib/constants";
import { BRAND_NAME, BRAND_SHORT } from "@/lib/brand";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/blog", label: "Journal" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totals } = useCart();
  const { theme, toggle } = useTheme();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 glass" data-testid="navbar">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-display font-bold text-sm group-hover:scale-105 transition-transform">
              {BRAND_SHORT}
            </div>
            <div className="font-display font-bold text-xl tracking-tight hidden sm:block">{BRAND_NAME}</div>
            <div className="font-display font-bold text-xl tracking-tight sm:hidden">{BRAND_SHORT}</div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                data-testid={`nav-${n.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <form onSubmit={submit} className="hidden lg:flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                data-testid="nav-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search prints…"
                className="h-9 w-56 rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </form>

            <Button variant="ghost" size="icon" onClick={toggle} data-testid="theme-toggle-btn" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" data-testid="nav-cart-btn" aria-label="Cart">
                <ShoppingCart className="h-5 w-5" />
                {totals.count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white font-mono-data">
                    {totals.count}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link to={user.role === "admin" || user.role === "staff" ? "/admin" : "/account"}>
                  <Button variant="ghost" size="sm" data-testid="nav-account-btn" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{user.name?.split(" ")[0] || "Account"}</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout} data-testid="nav-logout-btn">Logout</Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"><Button variant="ghost" size="sm" data-testid="nav-login-btn">Login</Button></Link>
                <Link to="/register"><Button size="sm" className="bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200" data-testid="nav-register-btn">Sign up</Button></Link>
              </div>
            )}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="nav-mobile-menu-btn">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0">
                <div className="p-6 border-b flex items-center justify-between">
                  <span className="font-display font-bold text-lg">Menu</span>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
                </div>
                <div className="p-4 space-y-1">
                  {NAV.map((n) => (
                    <NavLink key={n.to} to={n.to} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm">
                      {n.label}
                    </NavLink>
                  ))}
                  <div className="mt-4 border-t pt-4 space-y-1">
                    <div className="px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">Categories</div>
                    {CATEGORIES.slice(0, 8).map((c) => (
                      <Link key={c.slug} to={`/products/category/${c.slug}`} onClick={() => setOpen(false)} className="block px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground text-sm">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-4 border-t pt-4 space-y-2">
                    {user ? (
                      <>
                        <Link to={user.role === "admin" || user.role === "staff" ? "/admin" : "/account"} onClick={() => setOpen(false)}>
                          <Button variant="outline" className="w-full justify-start gap-2"><Package className="h-4 w-4" />{user.role === "admin" ? "Admin" : "My Account"}</Button>
                        </Link>
                        <Button className="w-full" onClick={() => { logout(); setOpen(false); }}>Logout</Button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setOpen(false)}><Button variant="outline" className="w-full">Login</Button></Link>
                        <Link to="/register" onClick={() => setOpen(false)}><Button className="w-full bg-zinc-950 dark:bg-white dark:text-zinc-950">Sign up</Button></Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

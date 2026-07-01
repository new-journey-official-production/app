import React from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users, Ticket, Star, BookOpen, Tag, BarChart3, Boxes, Printer, Settings as SettingsIcon, Sun, Moon, LogOut, Image as ImageIcon, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

const LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/printers", label: "Printers", icon: Printer },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/support", label: "Support", icon: Ticket },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/blog", label: "Blog", icon: BookOpen },
  { to: "/admin/media", label: "Media", icon: ImageIcon },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/activity", label: "Activity", icon: Activity },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr] bg-zinc-50 dark:bg-zinc-950">
      <aside className="hidden lg:flex flex-col border-r border-border bg-white dark:bg-zinc-900" data-testid="admin-sidebar">
        <div className="h-16 flex items-center gap-2 px-6 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-display font-bold">P</div>
          <div>
            <div className="font-display font-bold text-sm">PrintForge</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono-data">Studio OS</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`admin-nav-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t space-y-2">
          <div className="text-xs text-muted-foreground px-3 truncate">{user?.email}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={toggle} className="flex-1 gap-2">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light" : "Dark"}
            </Button>
            <Button variant="outline" size="sm" onClick={logout} className="flex-1 gap-2" data-testid="admin-logout-btn">
              <LogOut className="h-4 w-4" />Exit
            </Button>
          </div>
          <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">← Back to store</Link>
        </div>
      </aside>

      <div className="flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-white dark:bg-zinc-900 flex items-center justify-between px-4 lg:px-8 lg:hidden">
          <div className="font-display font-bold">PrintForge Studio</div>
          <Button variant="outline" size="sm" onClick={logout}>Exit</Button>
        </header>
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

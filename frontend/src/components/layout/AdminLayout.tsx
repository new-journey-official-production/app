import React, { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Ticket, Star, BookOpen, Tag, BarChart3, Boxes, Printer,
  Settings as SettingsIcon, Sun, Moon, LogOut, Image as ImageIcon, Activity, Shield, Receipt,
  Building2, FolderTree, FileText, MessageSquareQuote, Handshake, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BRAND_SHORT, BRAND_STUDIO } from "@/lib/brand";

const LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/billing", label: "Billing", icon: Receipt },
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
  { to: "/admin/permissions", label: "Permissions", icon: Shield },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

const B2B_LINKS = [
  { to: "/admin/b2b", label: "Overview", icon: Building2, end: true },
  { to: "/admin/b2b/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/b2b/products", label: "Products", icon: Package },
  { to: "/admin/b2b/catalog", label: "Catalog PDF", icon: FileText },
  { to: "/admin/b2b/quotes", label: "Quotes", icon: MessageSquareQuote },
  { to: "/admin/b2b/dealers", label: "Dealers", icon: Handshake },
  { to: "/admin/b2b/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/b2b/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [b2bOpen, setB2bOpen] = useState(true);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr] bg-zinc-50 dark:bg-zinc-950">
      <aside className="hidden lg:flex flex-col border-r border-border bg-white dark:bg-zinc-900" data-testid="admin-sidebar">
        <div className="h-16 flex items-center gap-2 px-6 border-b">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-display font-bold text-xs">{BRAND_SHORT}</div>
          <div>
            <div className="font-display font-bold text-sm">{BRAND_SHORT}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono-data">Studio OS</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {LINKS.slice(0, 4).map((l) => (
            <NavItem key={l.to} {...l} />
          ))}

          <Collapsible open={b2bOpen} onOpenChange={setB2bOpen} className="pt-1">
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <span className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> B2B Management</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${b2bOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-0.5 pl-1">
              {B2B_LINKS.map((l) => (
                <NavItem key={l.to} {...l} nested />
              ))}
            </CollapsibleContent>
          </Collapsible>

          {LINKS.slice(4).map((l) => (
            <NavItem key={l.to} {...l} />
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
          <div className="font-display font-bold">{BRAND_SHORT}</div>
          <Button variant="outline" size="sm" onClick={logout}>Exit</Button>
        </header>
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, end, nested }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; end?: boolean; nested?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      data-testid={`admin-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md py-2 text-sm transition-colors ${
          nested ? "pl-6 pr-3" : "px-3"
        } ${
          isActive ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

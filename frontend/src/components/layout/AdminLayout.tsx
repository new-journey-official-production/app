import React, { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag, Users, Ticket, Star, BookOpen, Tag, BarChart3, Boxes, Printer,
  Settings as SettingsIcon, Sun, Moon, LogOut, Image as ImageIcon, Activity, Shield, Receipt,
  Building2, FolderTree, FileText, MessageSquareQuote, Handshake, ChevronDown, Menu, X, FolderOpen,
  Wallet, Landmark, BadgeCheck, CreditCard, Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BRAND_SHORT, BRAND_STUDIO } from "@/lib/brand";

type NavLinkDef = { to: string; label: string; icon: React.ComponentType<{ className?: string }>; end?: boolean };

const OVERVIEW_LINKS: NavLinkDef[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
];

const ORDERS_LINKS: NavLinkDef[] = [
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/approvals", label: "Approvals", icon: BadgeCheck },
  { to: "/admin/billing", label: "Billing", icon: Receipt },
  { to: "/admin/customers", label: "Customers", icon: Users },
];

const MASTERS_LINKS: NavLinkDef[] = [
  { to: "/admin/payment-configuration", label: "Payment Configuration", icon: CreditCard },
  { to: "/admin/notification-configuration", label: "Notification Configuration", icon: Bell },
];

const CATALOG_LINKS: NavLinkDef[] = [
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderOpen },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
];

const OPERATIONS_LINKS: NavLinkDef[] = [
  { to: "/admin/printers", label: "Printers", icon: Printer },
  { to: "/admin/support", label: "Support", icon: Ticket },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
];

const B2B_LINKS: NavLinkDef[] = [
  { to: "/admin/b2b", label: "Overview", icon: Building2, end: true },
  { to: "/admin/b2b/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/b2b/products", label: "Products", icon: Package },
  { to: "/admin/b2b/catalog", label: "Catalog PDF", icon: FileText },
  { to: "/admin/b2b/quotes", label: "Quotes", icon: MessageSquareQuote },
  { to: "/admin/b2b/dealers", label: "Dealers", icon: Handshake },
  { to: "/admin/b2b/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/b2b/settings", label: "Settings", icon: SettingsIcon },
];

const ACCOUNTS_LINKS: NavLinkDef[] = [
  { to: "/admin/accounts", label: "Overview", icon: Landmark, end: true },
  { to: "/admin/accounts/expenses", label: "Expenses", icon: Wallet },
  { to: "/admin/accounts/income", label: "Income", icon: Receipt },
  { to: "/admin/accounts/bills", label: "Bills to pay", icon: FileText },
  { to: "/admin/accounts/payments", label: "Order payments", icon: ShoppingBag },
];

const CONTENT_LINKS: NavLinkDef[] = [
  { to: "/admin/blog", label: "Blog", icon: BookOpen },
  { to: "/admin/media", label: "Media", icon: ImageIcon },
];

const ANALYTICS_LINKS: NavLinkDef[] = [
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/activity", label: "Activity", icon: Activity },
];

const SYSTEM_LINKS: NavLinkDef[] = [
  { to: "/admin/permissions", label: "Permissions", icon: Shield },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

/** Sidebar sections — B2B and Accounts sit right after Operations. */
const NAV_SECTIONS = [
  { id: "orders", label: "Orders & Sales", links: ORDERS_LINKS },
  { id: "masters", label: "Masters", links: MASTERS_LINKS },
  { id: "catalog", label: "Catalog", links: CATALOG_LINKS },
  { id: "operations", label: "Operations", links: OPERATIONS_LINKS },
  { id: "b2b", label: "B2B Management", links: B2B_LINKS },
  { id: "accounts", label: "Accounts", links: ACCOUNTS_LINKS },
  { id: "content", label: "Content", links: CONTENT_LINKS },
  { id: "analytics", label: "Analytics", links: ANALYTICS_LINKS },
  { id: "system", label: "System", links: SYSTEM_LINKS },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    orders: true, masters: true, catalog: true, b2b: true, accounts: true, analytics: false, operations: false, content: false, system: false,
  });

  const toggleSection = (id: string) => setOpenSections((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="h-screen overflow-hidden grid grid-cols-1 lg:grid-cols-[240px_1fr] bg-zinc-50 dark:bg-zinc-950">
      <aside className="hidden lg:flex flex-col h-screen border-r border-border bg-white dark:bg-zinc-900 overflow-hidden" data-testid="admin-sidebar">
        <SidebarHeader />
        <AdminNav openSections={openSections} onToggleSection={toggleSection} onNavigate={() => {}} />
        <SidebarFooter user={user} theme={theme} toggle={toggle} logout={logout} />
      </aside>

      <div className="flex flex-col h-screen min-w-0 overflow-hidden">
        <header className="h-16 shrink-0 border-b border-border bg-white dark:bg-zinc-900 flex items-center justify-between px-4 lg:px-8 lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open admin menu" data-testid="admin-mobile-menu-btn">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between shrink-0">
                <div className="font-display font-bold">{BRAND_SHORT}</div>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></Button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <AdminNav
                  openSections={openSections}
                  onToggleSection={toggleSection}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
              <SidebarFooter user={user} theme={theme} toggle={toggle} logout={() => { logout(); setMobileOpen(false); }} />
            </SheetContent>
          </Sheet>
          <div className="font-display font-bold">{BRAND_SHORT}</div>
          <Button variant="outline" size="sm" onClick={logout}>Exit</Button>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarHeader() {
  return (
    <div className="h-16 shrink-0 flex items-center gap-2 px-6 border-b">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-display font-bold text-xs">{BRAND_SHORT}</div>
      <div>
        <div className="font-display font-bold text-sm">{BRAND_SHORT}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono-data">{BRAND_STUDIO}</div>
      </div>
    </div>
  );
}

function AdminNav({
  openSections,
  onToggleSection,
  onNavigate,
}: {
  openSections: Record<string, boolean>;
  onToggleSection: (id: string) => void;
  onNavigate: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 min-h-0">
      {OVERVIEW_LINKS.map((l) => <NavItem key={l.to} {...l} onNavigate={onNavigate} />)}

      {NAV_SECTIONS.map((section) => (
        <Collapsible key={section.id} open={openSections[section.id]} onOpenChange={() => onToggleSection(section.id)} className="pt-1">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <span>{section.label}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${openSections[section.id] ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-0.5 mt-0.5 pl-1">
            {section.links.map((l) => <NavItem key={l.to} {...l} nested onNavigate={onNavigate} />)}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </nav>
  );
}

function SidebarFooter({ user, theme, toggle, logout }: { user: { email?: string } | null | undefined; theme: string; toggle: () => void; logout: () => void }) {
  return (
    <div className="p-3 border-t space-y-2 shrink-0">
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
  );
}

function NavItem({ to, label, icon: Icon, end, nested, onNavigate }: NavLinkDef & { nested?: boolean; onNavigate: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      data-testid={`admin-nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md py-2 text-sm transition-colors ${nested ? "pl-6 pr-3" : "px-3"} ${
          isActive ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

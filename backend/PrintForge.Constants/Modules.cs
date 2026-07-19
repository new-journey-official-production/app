namespace PrintForge.Constants;

/// <summary>New Journey module IDs — sync with frontend modules.ts.</summary>
public static class Modules
{
    public const string Dashboard = "/admin";
    public const string Products = "/admin/products";
    public const string Orders = "/admin/orders";
    public const string Billing = "/admin/billing";
    public const string Inventory = "/admin/inventory";
    public const string Printers = "/admin/printers";
    public const string Customers = "/admin/customers";
    public const string Support = "/admin/support";
    public const string Reviews = "/admin/reviews";
    public const string Blog = "/admin/blog";
    public const string Coupons = "/admin/coupons";
    public const string Analytics = "/admin/analytics";
    public const string Media = "/admin/media";
    public const string ActivityLogs = "/admin/activity";
    public const string Settings = "/admin/settings";
    public const string Roles = "/admin/roles";
    public const string Users = "/admin/users";

    public const string B2bDashboard = "/admin/b2b";
    public const string B2bCategories = "/admin/b2b/categories";
    public const string B2bProducts = "/admin/b2b/products";
    public const string B2bCatalog = "/admin/b2b/catalog";
    public const string B2bQuotes = "/admin/b2b/quotes";
    public const string B2bDealers = "/admin/b2b/dealers";
    public const string B2bAnalytics = "/admin/b2b/analytics";
    public const string B2bSettings = "/admin/b2b/settings";
    public const string B2bPortal = "/b2b";

    public const string Accounts = "/admin/accounts";

    public const string Account = "/account";
    public const string AccountOrders = "/account/orders";
    public const string AccountWishlist = "/account/wishlist";
    public const string AccountProfile = "/account/profile";
    public const string AccountSupport = "/account/support";

    public const string Storefront = "/";
    public const string Catalog = "/products";
    public const string Checkout = "/checkout";

    public const string FieldPrefix = "flds_";

    public static readonly string[] AdminModules =
    [
        Dashboard, Products, Orders, Billing, Inventory, Printers, Customers,
        Support, Reviews, Blog, Coupons, Analytics, Media, ActivityLogs,
        Settings, Roles, Users,
        B2bDashboard, B2bCategories, B2bProducts, B2bCatalog, B2bQuotes, B2bDealers, B2bAnalytics, B2bSettings,
        Accounts
    ];

    /// <summary>
    /// Storefront + customer modules — skip RBAC gate on API calls.
    /// Authentication is still enforced by [UserAuthorize] on controllers.
    /// </summary>
    public static readonly string[] PublicModules =
    [
        Storefront, Catalog, B2bPortal,
        Account, AccountOrders, AccountWishlist, AccountProfile, AccountSupport, Checkout
    ];

    public static readonly ModuleDefinition[] AllModules =
    [
        new(Dashboard, "Dashboard", "Admin dashboard", "admin"),
        new(Products, "Products", "Product catalog management", "admin"),
        new(Orders, "Orders", "Order management", "admin"),
        new(Billing, "Billing", "Payment tracking and invoices", "admin"),
        new(Inventory, "Inventory", "Inventory management", "admin"),
        new(Printers, "Printers", "Printer fleet management", "admin"),
        new(Customers, "Customers", "Customer management", "admin"),
        new(Support, "Support", "Support ticket management", "admin"),
        new(Reviews, "Reviews", "Review moderation", "admin"),
        new(Blog, "Blog", "Blog management", "admin"),
        new(Coupons, "Coupons", "Coupon management", "admin"),
        new(Analytics, "Analytics", "Analytics dashboard", "admin"),
        new(Media, "Media", "Media library", "admin"),
        new(ActivityLogs, "Activity Logs", "Admin activity audit", "admin"),
        new(Settings, "Settings", "System settings", "admin"),
        new(Roles, "Roles", "Role management", "admin"),
        new(Users, "Users", "User permission management", "admin"),
        new(B2bDashboard, "B2B Dashboard", "B2B catalog management overview", "admin"),
        new(B2bCategories, "B2B Categories", "B2B category management", "admin"),
        new(B2bProducts, "B2B Products", "B2B product management", "admin"),
        new(B2bCatalog, "B2B Catalog Generator", "PDF catalog generation", "admin"),
        new(B2bQuotes, "B2B Quote Requests", "Wholesale quote request management", "admin"),
        new(B2bDealers, "B2B Dealers", "Dealer registration management", "admin"),
        new(B2bAnalytics, "B2B Analytics", "B2B catalog analytics", "admin"),
        new(B2bSettings, "B2B Settings", "B2B module settings", "admin"),
        new(Accounts, "Accounts", "Company finance and ledger", "admin"),
        new(Account, "Account", "Customer account dashboard", "customer"),
        new(AccountOrders, "My Orders", "Customer order history", "customer"),
        new(AccountWishlist, "Wishlist", "Customer wishlist", "customer"),
        new(AccountProfile, "Profile", "Customer profile", "customer"),
        new(AccountSupport, "Customer Support", "Customer support tickets", "customer"),
        new(Checkout, "Checkout", "Place orders", "customer"),
        new(Storefront, "Storefront", "Public storefront", "public"),
        new(Catalog, "Catalog", "Product catalog browsing", "public"),
        new(B2bPortal, "B2B Portal", "Public B2B wholesale catalog", "public")
    ];
}

public record ModuleDefinition(string ModuleId, string Name, string Description, string Group);

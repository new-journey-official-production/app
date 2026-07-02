namespace PrintForge.Constants;

/// <summary>New Journey module IDs — sync with frontend modules.ts.</summary>
public static class Modules
{
    public const string Dashboard = "/admin";
    public const string Products = "/admin/products";
    public const string Orders = "/admin/orders";
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
        Dashboard, Products, Orders, Inventory, Printers, Customers,
        Support, Reviews, Blog, Coupons, Analytics, Media, ActivityLogs,
        Settings, Roles, Users
    ];

    public static readonly ModuleDefinition[] AllModules =
    [
        new(Dashboard, "Dashboard", "Admin dashboard", "admin"),
        new(Products, "Products", "Product catalog management", "admin"),
        new(Orders, "Orders", "Order management", "admin"),
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
        new(Account, "Account", "Customer account dashboard", "customer"),
        new(AccountOrders, "My Orders", "Customer order history", "customer"),
        new(AccountWishlist, "Wishlist", "Customer wishlist", "customer"),
        new(AccountProfile, "Profile", "Customer profile", "customer"),
        new(AccountSupport, "Customer Support", "Customer support tickets", "customer"),
        new(Checkout, "Checkout", "Place orders", "customer"),
        new(Storefront, "Storefront", "Public storefront", "public"),
        new(Catalog, "Catalog", "Product catalog browsing", "public")
    ];
}

public record ModuleDefinition(string ModuleId, string Name, string Description, string Group);

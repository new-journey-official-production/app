namespace PrintForge.Constants;

public static class BackendConstants
{
    public const string BrandName = "New Journey";
    public const string BrandShort = "NJ";
    public const string BrandStudio = "New Journey Studio";
    public const string OrderNoPrefix = "NJ-";

    public const string AccessTokenCookie = "access_token";
    public const string RefreshTokenCookie = "refresh_token";
    public const string DefaultTenantId = "default";
    public const string DefaultLocationId = "default";

    public const int AccessTokenMinutes = 60 * 12;
    public const int RefreshTokenDays = 30;
    public const int MaxMediaBytes = 3 * 1024 * 1024;

    public static readonly HashSet<string> AllowedMediaTypes =
    [
        "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"
    ];

    public static readonly string[] OrderStatuses =
    [
        "placed", "payment_received", "accepted", "printing_scheduled",
        "printing_started", "quality_inspection", "packed", "shipped",
        "out_for_delivery", "delivered", "completed", "cancelled"
    ];

    public static readonly string[] ProductCsvFields =
    [
        "name", "slug", "category_slug", "material", "price", "discount_price",
        "stock", "weight_g", "dimensions", "print_time_hours",
        "color_variants", "images", "tags", "featured", "is_active",
        "short_description", "description", "seo_title", "seo_description"
    ];

    public static readonly (string Name, string Slug, string Icon, string Image)[] CategoryDefs =
    [
        ("Kitchen", "kitchen", "utensils", "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"),
        ("Home Utility", "home-utility", "home", "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=800"),
        ("Office", "office", "briefcase", "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"),
        ("Education", "education", "graduation-cap", "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800"),
        ("Farming", "farming", "sprout", "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800"),
        ("Decoration", "decoration", "sparkles", "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800"),
        ("Religious", "religious", "hand-heart", "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800"),
        ("Automotive", "automotive", "car", "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"),
        ("Mobile Accessories", "mobile-accessories", "smartphone", "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800"),
        ("Gaming", "gaming", "gamepad-2", "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"),
        ("Gifts", "gifts", "gift", "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800"),
        ("Custom Prints", "custom-prints", "wand-2", "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800"),
        ("Accessories", "accessories", "package", "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800")
    ];
}

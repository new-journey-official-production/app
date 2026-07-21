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

    /// <summary>Payment transaction statuses — gateway-agnostic verification pipeline.</summary>
    public static readonly string[] PaymentStatuses =
    [
        "pending", "verification_pending", "approved", "rejected", "refunded", "paid", "failed"
    ];

    public static readonly HashSet<string> ManualUpiMethods =
        new(StringComparer.OrdinalIgnoreCase) { "upi", "gpay", "phonepe", "paytm" };

    public static readonly string[] PaymentMethodTypes = ["upi", "gateway", "cod"];

    public static readonly string[] PaymentRejectionReasons =
    [
        "Payment Not Received",
        "Wrong Amount",
        "Invalid Screenshot",
        "Transaction Failed"
    ];

    public static readonly string[] ProductCsvFields =
    [
        "name", "slug", "category_slug", "material", "price", "discount_price",
        "stock", "weight_g", "dimensions", "print_time_hours",
        "color_variants", "images", "tags", "featured", "is_active",
        "short_description", "description", "seo_title", "seo_description"
    ];
}

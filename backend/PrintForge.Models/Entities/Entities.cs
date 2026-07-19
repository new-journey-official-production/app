namespace PrintForge.Models.Entities;

public class User
{
    public string Id { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "customer";
    public string? RoleId { get; set; }
    public string? AvatarUrl { get; set; }
    public bool EmailVerified { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class Category
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
}

public class StorefrontSettings
{
    public string Id { get; set; } = "default";
    public string HeroImage { get; set; } = string.Empty;
    public string HeroTitle { get; set; } = string.Empty;
    public string HeroSubtitle { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class Product
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public double Price { get; set; }
    public double? DiscountPrice { get; set; }
    public int Stock { get; set; }
    public string Material { get; set; } = "PLA";
    public double? WeightG { get; set; }
    public string? Dimensions { get; set; }
    public double? PrintTimeHours { get; set; }
    public List<string> ColorVariants { get; set; } = [];
    public List<B2bColor> Colors { get; set; } = [];
    public string HeroImage { get; set; } = string.Empty;
    public List<string> Images { get; set; } = [];
    public List<string> Tags { get; set; } = [];
    public bool Featured { get; set; }
    public bool IsActive { get; set; } = true;
    public string? SeoTitle { get; set; }
    public string? SeoDescription { get; set; }
    public double RatingAvg { get; set; }
    public int RatingCount { get; set; }
    public int OrdersCount { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class Review
{
    public string Id { get; set; } = string.Empty;

    public string ProductId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public int Rating { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public bool Approved { get; set; } = true;
    public string CreatedAt { get; set; } = string.Empty;
}

public class WishlistItem
{
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class Address
{
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string Label { get; set; } = "Home";
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public bool IsDefault { get; set; }
    public string CreatedAt { get; set; } = string.Empty;

    /** Snapshot for jsonb storage on orders — not used for Dapper table reads. */
    public EmbeddedAddress ToEmbedded() => new()
    {
        Id = Id,
        UserId = UserId,
        Label = Label,
        FullName = FullName,
        Phone = Phone,
        Line1 = Line1,
        Line2 = Line2,
        City = City,
        State = State,
        PostalCode = PostalCode,
        Country = Country,
        IsDefault = IsDefault,
        CreatedAt = CreatedAt,
    };
}

/// <summary>Address snapshot stored as jsonb on orders. Separate from <see cref="Address"/> so Dapper table queries are not JSON-parsed.</summary>
public class EmbeddedAddress
{
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string Label { get; set; } = "Home";
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string Country { get; set; } = "India";
    public bool IsDefault { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class Coupon
{
    public string Id { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;
    public string Kind { get; set; } = "percent";
    public double Value { get; set; }
    public double MinOrder { get; set; }
    public double? MaxDiscount { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ExpiresAt { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class OrderItem
{
    public string ProductId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string Slug { get; set; } = string.Empty;
    public double Price { get; set; }
    public int Quantity { get; set; }
    public string? Variant { get; set; }
}

public class OrderTimelineEntry
{
    public string Status { get; set; } = string.Empty;
    public string At { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
}

public class Order
{
    public string Id { get; set; } = string.Empty;

    public string OrderNo { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public List<OrderItem> Items { get; set; } = [];
    public EmbeddedAddress Address { get; set; } = new();
    public string PaymentMethod { get; set; } = string.Empty;
    public string? CouponCode { get; set; }
    public double Subtotal { get; set; }
    public double Shipping { get; set; }
    public double Gst { get; set; }
    public double Discount { get; set; }
    public double Total { get; set; }
    public string Status { get; set; } = "placed";
    public List<OrderTimelineEntry> Timeline { get; set; } = [];
    public string? Notes { get; set; }
    public string Priority { get; set; } = "normal";
    public string? PrinterId { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class InventoryItem
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Kind { get; set; } = "filament";
    public string? Material { get; set; }
    public string? Color { get; set; }
    public double Quantity { get; set; }
    public string Unit { get; set; } = "kg";
    public double ReorderLevel { get; set; }
    public double UnitCost { get; set; }
    public string? Supplier { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class Printer
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Status { get; set; } = "idle";
    public string NozzleSize { get; set; } = "0.4mm";
    public string? FilamentLoaded { get; set; }
    public string? CurrentJob { get; set; }
    public double TotalHours { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class TicketMessage
{
    public string From { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string At { get; set; } = string.Empty;
}

public class Ticket
{
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string? OrderNo { get; set; }
    public string Status { get; set; } = "open";
    public List<TicketMessage> Messages { get; set; } = [];
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class Notification
{
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string? RefId { get; set; }
    public bool Read { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class BlogPost
{
    public string Id { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? CoverImage { get; set; }
    public List<string> Tags { get; set; } = [];
    public bool IsPublished { get; set; } = true;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class MediaItem
{
    public string Id { get; set; } = string.Empty;

    public string Filename { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public int Size { get; set; }
    public string Data { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string UploadedBy { get; set; } = string.Empty;
}

public class ActivityLog
{
    public string Id { get; set; } = string.Empty;

    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public Dictionary<string, object?> Meta { get; set; } = [];
    public string CreatedAt { get; set; } = string.Empty;
}

public class Payment
{
    public string Id { get; set; } = string.Empty;

    public string OrderId { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public double Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

/// <summary>Payment row joined with order fields for admin billing list.</summary>
public class BillingRow
{
    public string Id { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string OrderNo { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public double Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public string OrderStatus { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class PasswordReset
{
    public string Id { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string ExpiresAt { get; set; } = string.Empty;
    public bool Used { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

public class ModuleEntity
{
    public string? Id { get; set; }

    public string ModuleId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, object?> Metadata { get; set; } = [];
}

public class Role
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TenantId { get; set; } = "default";
    public Dictionary<string, object?> Metadata { get; set; } = [];
    public string CreatedAt { get; set; } = string.Empty;
}

public class RolePermission
{
    public string RoleId { get; set; } = string.Empty;
    public string ModuleId { get; set; } = string.Empty;
    public int PermissionBits { get; set; }
}

public class UserPermission
{
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string ModuleId { get; set; } = string.Empty;
    public int PermissionBits { get; set; }
    public Dictionary<string, object?> Metadata { get; set; } = [];
}

public class EmailLog
{
    public string Id { get; set; } = string.Empty;

    public string To { get; set; } = string.Empty;
    public string Template { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public Dictionary<string, object?> Context { get; set; } = [];
    public string CreatedAt { get; set; } = string.Empty;
}

public class NewsletterSubscriber
{
    public string Id { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

public class ContactMessage
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

/** Ledger row for company expenses, income, and bills. */
public class FinanceEntry
{
    public string Id { get; set; } = string.Empty;
    public string Kind { get; set; } = "expense";
    public string Title { get; set; } = string.Empty;
    public double Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public string ReferenceId { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public string PaidAt { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

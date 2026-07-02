using MongoDB.Bson.Serialization.Attributes;

namespace PrintForge.Models.Entities;

[BsonIgnoreExtraElements]
public class User
{
    [BsonElement("id")]
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

[BsonIgnoreExtraElements]
public class Category
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class Product
{
    [BsonElement("id")]
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

[BsonIgnoreExtraElements]
public class Review
{
    [BsonElement("id")]
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

[BsonIgnoreExtraElements]
public class WishlistItem
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string ProductId { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class Address
{
    [BsonElement("id")]
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

[BsonIgnoreExtraElements]
public class Coupon
{
    [BsonElement("id")]
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

[BsonIgnoreExtraElements]
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

[BsonIgnoreExtraElements]
public class OrderTimelineEntry
{
    public string Status { get; set; } = string.Empty;
    public string At { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class Order
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string OrderNo { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public List<OrderItem> Items { get; set; } = [];
    public Address Address { get; set; } = new();
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

[BsonIgnoreExtraElements]
public class InventoryItem
{
    [BsonElement("id")]
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

[BsonIgnoreExtraElements]
public class Printer
{
    [BsonElement("id")]
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

[BsonIgnoreExtraElements]
public class TicketMessage
{
    public string From { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string At { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class Ticket
{
    [BsonElement("id")]
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

[BsonIgnoreExtraElements]
public class Notification
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string? RefId { get; set; }
    public bool Read { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class BlogPost
{
    [BsonElement("id")]
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

[BsonIgnoreExtraElements]
public class MediaItem
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string Filename { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public int Size { get; set; }
    public string Data { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string UploadedBy { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class ActivityLog
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? UserName { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Target { get; set; } = string.Empty;
    public Dictionary<string, object?> Meta { get; set; } = [];
    public string CreatedAt { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class Payment
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string OrderId { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public double Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class PasswordReset
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string ExpiresAt { get; set; } = string.Empty;
    public bool Used { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class ModuleEntity
{
    [BsonElement("id")]
    public string? Id { get; set; }

    public string ModuleId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Dictionary<string, object?> Metadata { get; set; } = [];
}

[BsonIgnoreExtraElements]
public class Role
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TenantId { get; set; } = "default";
    public Dictionary<string, object?> Metadata { get; set; } = [];
    public string CreatedAt { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class RolePermission
{
    public string RoleId { get; set; } = string.Empty;
    public string ModuleId { get; set; } = string.Empty;
    public int PermissionBits { get; set; }
}

[BsonIgnoreExtraElements]
public class UserPermission
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string ModuleId { get; set; } = string.Empty;
    public int PermissionBits { get; set; }
    public Dictionary<string, object?> Metadata { get; set; } = [];
}

[BsonIgnoreExtraElements]
public class EmailLog
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string To { get; set; } = string.Empty;
    public string Template { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public Dictionary<string, object?> Context { get; set; } = [];
    public string CreatedAt { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class NewsletterSubscriber
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

[BsonIgnoreExtraElements]
public class ContactMessage
{
    [BsonElement("id")]
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
}

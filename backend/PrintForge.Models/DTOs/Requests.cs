using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PrintForge.Models.DTOs;

public record ApiResponse<T>(string Status, T Result)
{
    public static ApiResponse<T> Success(T result) => new("success", result);
}

public record OkResponse(bool Ok = true);
public record MessageResponse(bool Ok, string Message);

public class RegisterRequest
{
    [Required, MinLength(1), MaxLength(80)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6), MaxLength(128)]
    public string Password { get; set; } = string.Empty;

    public string? Phone { get; set; }
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;
}

public class ProfileUpdateRequest
{
    public string? Name { get; set; }
    public string? Phone { get; set; }

    [JsonPropertyName("avatar_url")]
    public string? AvatarUrl { get; set; }
}

public class ProductRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Slug { get; set; }
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("short_description")]
    public string ShortDescription { get; set; } = string.Empty;

    [JsonPropertyName("category_slug")]
    public string CategorySlug { get; set; } = string.Empty;

    public double Price { get; set; }

    [JsonPropertyName("discount_price")]
    public double? DiscountPrice { get; set; }

    public int Stock { get; set; }
    public string Material { get; set; } = "PLA";

    [JsonPropertyName("weight_g")]
    public double? WeightG { get; set; }

    public string? Dimensions { get; set; }

    [JsonPropertyName("print_time_hours")]
    public double? PrintTimeHours { get; set; }

    [JsonPropertyName("color_variants")]
    public List<string> ColorVariants { get; set; } = [];

    public List<string> Images { get; set; } = [];
    public List<string> Tags { get; set; } = [];
    public bool Featured { get; set; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("seo_title")]
    public string? SeoTitle { get; set; }

    [JsonPropertyName("seo_description")]
    public string? SeoDescription { get; set; }
}

public class ReviewRequest
{
    [JsonPropertyName("product_id")]
    public string ProductId { get; set; } = string.Empty;

    [Range(1, 5)]
    public int Rating { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
}

public class AddressRequest
{
    public string Label { get; set; } = "Home";

    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;
    public string Line1 { get; set; } = string.Empty;
    public string? Line2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("postal_code")]
    public string PostalCode { get; set; } = string.Empty;

    public string Country { get; set; } = "India";

    [JsonPropertyName("is_default")]
    public bool IsDefault { get; set; }
}

public class CouponRequest
{
    public string Code { get; set; } = string.Empty;
    public string Kind { get; set; } = "percent";
    public double Value { get; set; }

    [JsonPropertyName("min_order")]
    public double MinOrder { get; set; }

    [JsonPropertyName("max_discount")]
    public double? MaxDiscount { get; set; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("expires_at")]
    public string? ExpiresAt { get; set; }
}

public class OrderItemRequest
{
    [JsonPropertyName("product_id")]
    public string ProductId { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; } = 1;

    public string? Variant { get; set; }
}

public class OrderCreateRequest
{
    public List<OrderItemRequest> Items { get; set; } = [];

    [JsonPropertyName("address_id")]
    public string AddressId { get; set; } = string.Empty;

    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;

    [JsonPropertyName("coupon_code")]
    public string? CouponCode { get; set; }

    public string? Notes { get; set; }
}

public class InventoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string Kind { get; set; } = "filament";
    public string? Material { get; set; }
    public string? Color { get; set; }
    public double Quantity { get; set; }
    public string Unit { get; set; } = "kg";

    [JsonPropertyName("reorder_level")]
    public double ReorderLevel { get; set; }

    [JsonPropertyName("unit_cost")]
    public double UnitCost { get; set; }

    public string? Supplier { get; set; }
}

public class PrinterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Status { get; set; } = "idle";

    [JsonPropertyName("nozzle_size")]
    public string NozzleSize { get; set; } = "0.4mm";

    [JsonPropertyName("filament_loaded")]
    public string? FilamentLoaded { get; set; }

    [JsonPropertyName("current_job")]
    public string? CurrentJob { get; set; }

    [JsonPropertyName("total_hours")]
    public double TotalHours { get; set; }
}

public class TicketRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("order_no")]
    public string? OrderNo { get; set; }
}

public class TicketReplyRequest
{
    public string Message { get; set; } = string.Empty;
}

public class BlogPostRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string Excerpt { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("cover_image")]
    public string? CoverImage { get; set; }

    public List<string> Tags { get; set; } = [];

    [JsonPropertyName("is_published")]
    public bool IsPublished { get; set; } = true;
}

public class NewsletterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ContactRequest
{
    public string Name { get; set; } = string.Empty;

    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class RoleRequest
{
    [Required, MinLength(1), MaxLength(80)]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
    public Dictionary<string, object?> Metadata { get; set; } = [];
}

public class PermissionEntry
{
    [JsonPropertyName("module_id")]
    public string ModuleId { get; set; } = string.Empty;

    [JsonPropertyName("permission_bits")]
    public int PermissionBits { get; set; }
}

public class RolePermissionsRequest
{
    public List<PermissionEntry> Permissions { get; set; } = [];
}

public class ProductListResponse
{
    public List<Dictionary<string, object?>> Items { get; set; } = [];
    public long Total { get; set; }
}

public class MediaUploadResponse
{
    public string Id { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Filename { get; set; } = string.Empty;
    public int Size { get; set; }

    [JsonPropertyName("content_type")]
    public string ContentType { get; set; } = string.Empty;
}

public class ImportProductsResponse
{
    public int Created { get; set; }
    public int Updated { get; set; }
    public List<Dictionary<string, object?>> Errors { get; set; } = [];
}

public class ImportProductRowsRequest
{
    public List<Dictionary<string, string>> Rows { get; set; } = [];
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public string? RoleId { get; set; }

    [JsonPropertyName("avatar_url")]
    public string? AvatarUrl { get; set; }

    [JsonPropertyName("email_verified")]
    public bool EmailVerified { get; set; }

    [JsonPropertyName("created_at")]
    public string CreatedAt { get; set; } = string.Empty;

    [JsonPropertyName("lifetime_spend")]
    public double? LifetimeSpend { get; set; }

    [JsonPropertyName("orders_count")]
    public int? OrdersCount { get; set; }
}

public class PermissionResponseEntry
{
    public int Permission { get; set; }

    [JsonPropertyName("moduleID")]
    public string ModuleId { get; set; } = string.Empty;
}

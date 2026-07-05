using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;

namespace PrintForge.Services.Interfaces;

public interface IAuthService
{
    Task<UserDto> RegisterAsync(RegisterRequest request);
    Task<UserDto> LoginAsync(LoginRequest request);
    Task<UserDto?> GetMeAsync(string userId);
    Task RefreshAsync(string refreshToken);
    Task ForgotPasswordAsync(ForgotPasswordRequest request);
    Task ResetPasswordAsync(ResetPasswordRequest request);
    Task<UserDto> UpdateProfileAsync(string userId, ProfileUpdateRequest request);
}

public interface IPermissionService
{
    Task SeedRbacAsync();
    Task<Dictionary<string, PermissionResponseEntry>> GetPermissionsForResponseAsync(string userId);
    Task<Dictionary<string, int>> LoadEffectivePermissionsAsync(string userId);
    Task<bool> CheckPermissionAsync(string userId, string moduleId, int requiredBits);
    Task UpdateRolePermissionsAsync(string roleId, List<PermissionEntry> matrix);
    Task UpdateUserPermissionsAsync(string userId, List<PermissionEntry> matrix);
    Task<Dictionary<string, int>> GetRolePermissionsAsync(string roleId);
    void InvalidateCache(string? userId = null);
}

public interface IEmailService
{
    Task SendAsync(string to, string template, Dictionary<string, object?> ctx);
}

public interface IPaymentService
{
    Task<Payment> ChargeAsync(string orderId, string method, double amount);
}

public interface IBillingService
{
    Task<List<Dictionary<string, object?>>> AdminListAsync(string? status, string? q, int limit);
    Task<Dictionary<string, object?>> UpdateStatusAsync(User user, string paymentId, string status);
    Task<Dictionary<string, object?>> GetOrderBillingAsync(string orderId);
}

public interface IActivityLogService
{
    Task LogAsync(User? user, string action, string target, Dictionary<string, object?>? meta = null);
}

public interface IProductService
{
    Task<object> ListAsync(string? category, string? q, string? material, double? minPrice, double? maxPrice, bool? featured, string? sort, int limit, int skip);
    Task<object> GetBySlugAsync(string slug);
    Task<Dictionary<string, object?>> CreateAsync(User user, ProductRequest request);
    Task<Dictionary<string, object?>> UpdateAsync(User user, string pid, Dictionary<string, object?> payload);
    Task DeleteAsync(User user, string pid);
    Task<(byte[] Data, string Filename)> ExportCsvAsync();
    Task<(byte[] Data, string Filename)> ExportTemplateAsync();
    Task<ImportProductsResponse> ImportCsvAsync(User user, Stream csvStream);
    Task<ImportProductsResponse> ImportRowsAsync(User user, IReadOnlyList<Dictionary<string, string>> rows);
}

public interface IOrderService
{
    Task<Dictionary<string, object?>> CreateAsync(User user, OrderCreateRequest request);
    Task<List<Dictionary<string, object?>>> GetMyOrdersAsync(string userId);
    Task<Dictionary<string, object?>> GetOrderAsync(User user, string oid);
    Task<List<Dictionary<string, object?>>> AdminListAsync(string? status, string? q, int limit);
    Task<Dictionary<string, object?>> AdminUpdateStatusAsync(User user, string oid, Dictionary<string, object?> payload);
    Task<Dictionary<string, object?>> AdminUpdateAsync(string oid, Dictionary<string, object?> payload);
}

public record CouponValidationResult(Dictionary<string, object?> Coupon, double Discount);

public interface ICouponService
{
    Task<CouponValidationResult> ValidateAsync(string code, double subtotal);
    Task<List<Dictionary<string, object?>>> ListAsync();
    Task<Dictionary<string, object?>> CreateAsync(CouponRequest request);
    Task<Dictionary<string, object?>> UpdateAsync(string cid, Dictionary<string, object?> payload);
    Task DeleteAsync(string cid);
}

public interface ISeedDataService
{
    Task SeedAsync();
}

public interface IRbacService
{
    Task<object> MyPermissionsAsync(string userId);
    Task<object> GetUserPermissionsAsync(string uuid);
    Task<object> UpdateUserPermissionsAsync(string uuid, RolePermissionsRequest request);
    Task<object> ListModulesAsync();
    Task<object> ListRolesAsync();
    Task<object> CreateRoleAsync(RoleRequest request);
    Task<object> GetRoleAsync(string roleId);
    Task<object> UpdateRoleAsync(string roleId, Dictionary<string, object?> payload);
    Task<object> DeleteRoleAsync(string roleId);
    Task<object> UpdateRolePermissionsAsync(string roleId, RolePermissionsRequest request);
    Task<object> ListUsersAsync();
}

public interface IAnalyticsService
{
    Task<Dictionary<string, object?>> GetSummaryAsync();
}

public interface IMediaService
{
    Task<List<Dictionary<string, object?>>> ListAsync(int limit);
    Task<(byte[] Data, string ContentType)> GetBinaryAsync(string mid);
    Task<MediaUploadResponse> UploadAsync(User user, Stream fileStream, string filename, string contentType);
    Task DeleteAsync(User user, string mid);
}

using PrintForge.Models.Entities;

namespace PrintForge.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> FindByIdAsync(string id);
    Task<User?> FindByEmailAsync(string email);
    Task InsertAsync(User user);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task<List<User>> FindCustomersAsync(int limit = 1000);
    Task<List<User>> FindAllForAdminAsync(int limit = 500);
    Task UpdateManyByRoleAsync(string role, string roleId);
    Task<long> CountCustomersAsync();
}

public interface ICategoryRepository
{
    Task<List<Category>> ListAsync();
    Task<long> CountAsync();
    Task InsertManyAsync(IEnumerable<Category> categories);
}

public interface IProductRepository
{
    Task<(List<Product> Items, long Total)> ListAsync(ProductQuery query);
    Task<Product?> FindBySlugOrIdAsync(string slugOrId);
    Task<Product?> FindByIdAsync(string id);
    Task<Product?> FindBySlugAsync(string slug);
    Task InsertAsync(Product product);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task DeleteAsync(string id);
    Task<List<Product>> FindByIdsAsync(IEnumerable<string> ids);
    Task<List<Product>> FindRelatedAsync(string categorySlug, string excludeId, int limit = 6);
    Task<List<Product>> ListAllAsync(int limit = 5000);
    Task IncrementStockAsync(string productId, int delta, int orderDelta = 0);
}

public record ProductQuery(
    string? Category = null,
    string? Query = null,
    string? Material = null,
    double? MinPrice = null,
    double? MaxPrice = null,
    bool? Featured = null,
    string? Sort = null,
    int Limit = 60,
    int Skip = 0,
    bool ActiveOnly = true);

public interface IReviewRepository
{
    Task InsertAsync(Review review);
    Task<List<Review>> FindByProductAsync(string productId, bool approvedOnly = true);
    Task<List<Review>> ListAllAsync(int limit = 200);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task<List<Review>> FindApprovedByProductAsync(string productId);
}

public interface IWishlistRepository
{
    Task<List<WishlistItem>> FindByUserAsync(string userId);
    Task<bool> ExistsAsync(string userId, string productId);
    Task InsertAsync(WishlistItem item);
    Task DeleteAsync(string userId, string productId);
}

public interface IAddressRepository
{
    Task<List<Address>> FindByUserAsync(string userId);
    Task<Address?> FindByIdAndUserAsync(string id, string userId);
    Task InsertAsync(Address address);
    Task UpdateAsync(string id, string userId, Dictionary<string, object?> updates);
    Task ClearDefaultAsync(string userId);
    Task DeleteAsync(string id, string userId);
}

public interface ICouponRepository
{
    Task<Coupon?> FindByCodeAsync(string code);
    Task<List<Coupon>> ListAsync();
    Task InsertAsync(Coupon coupon);
    Task DeleteAsync(string id);
    Task<long> CountAsync();
    Task InsertManyAsync(IEnumerable<Coupon> coupons);
}

public interface IOrderRepository
{
    Task InsertAsync(Order order);
    Task<Order?> FindByIdAsync(string id);
    Task<Order?> FindByIdForUserAsync(string id, string userId);
    Task<List<Order>> FindByUserAsync(string userId);
    Task<List<Order>> AdminListAsync(string? status, string? query, int limit);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task PushTimelineAsync(string id, OrderTimelineEntry entry, string status);
    Task<List<Order>> ListAllAsync(int limit = 5000);
    Task<long> CountByStatusesAsync(IEnumerable<string> statuses);
}

public interface IInventoryRepository
{
    Task<List<InventoryItem>> ListAsync();
    Task InsertAsync(InventoryItem item);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task DeleteAsync(string id);
    Task<List<InventoryItem>> FindLowStockAsync();
    Task<long> CountAsync();
    Task InsertManyAsync(IEnumerable<InventoryItem> items);
}

public interface IPrinterRepository
{
    Task<List<Printer>> ListAsync();
    Task InsertAsync(Printer printer);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task DeleteAsync(string id);
    Task<long> CountAsync();
    Task InsertManyAsync(IEnumerable<Printer> printers);
}

public interface ITicketRepository
{
    Task<List<Ticket>> FindByUserAsync(string userId);
    Task<Ticket?> FindByIdAsync(string id);
    Task InsertAsync(Ticket ticket);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task PushMessageAsync(string id, TicketMessage message, string status);
    Task<List<Ticket>> ListAllAsync(int limit = 200);
}

public interface INotificationRepository
{
    Task<List<Notification>> FindByUserAsync(string userId, int limit = 100);
    Task InsertAsync(Notification notification);
    Task MarkReadAsync(string id, string userId);
}

public interface IBlogRepository
{
    Task<List<BlogPost>> ListPublishedAsync(int limit);
    Task<BlogPost?> FindBySlugAsync(string slug);
    Task InsertAsync(BlogPost post);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task DeleteAsync(string id);
    Task<long> CountAsync();
    Task InsertManyAsync(IEnumerable<BlogPost> posts);
}

public interface IMediaRepository
{
    Task<List<MediaItem>> ListWithoutDataAsync(int limit);
    Task<MediaItem?> FindByIdAsync(string id);
    Task InsertAsync(MediaItem item);
    Task DeleteAsync(string id);
}

public interface IActivityLogRepository
{
    Task InsertAsync(ActivityLog log);
    Task<List<ActivityLog>> ListAsync(int limit, string? action);
}

public interface IPaymentRepository
{
    Task InsertAsync(Payment payment);
}

public interface IPasswordResetRepository
{
    Task<PasswordReset?> FindValidTokenAsync(string token);
    Task InsertAsync(PasswordReset reset);
    Task MarkUsedAsync(string id);
}

public interface IRbacRepository
{
    Task UpsertModuleAsync(ModuleEntity module);
    Task<List<ModuleEntity>> ListModulesAsync();
    Task<Role?> FindRoleBySlugAsync(string slug);
    Task<Role?> FindRoleByIdAsync(string id);
    Task InsertRoleAsync(Role role);
    Task<List<Role>> ListRolesAsync();
    Task UpdateRoleAsync(string id, Dictionary<string, object?> updates);
    Task DeleteRoleAsync(string id);
    Task<long> CountUsersWithRoleAsync(string roleId);
    Task UpsertRolePermissionAsync(string roleId, string moduleId, int bits);
    Task DeleteRolePermissionsAsync(string roleId);
    Task<Dictionary<string, int>> GetRolePermissionsAsync(string roleId);
    Task<Dictionary<string, int>> GetUserOverridesAsync(string userId);
    Task ReplaceUserPermissionsAsync(string userId, IEnumerable<UserPermission> permissions);
    Task<List<User>> FindUsersByRoleIdAsync(string roleId);
}

public interface IEmailLogRepository
{
    Task InsertAsync(EmailLog log);
}

public interface INewsletterRepository
{
    Task UpsertAsync(string email, string id, string createdAt);
}

public interface IContactRepository
{
    Task InsertAsync(ContactMessage message);
}

public interface IPermissionRepository
{
    Task<Dictionary<string, int>> LoadEffectivePermissionsAsync(string userId);
    void InvalidateCache(string? userId = null);
}

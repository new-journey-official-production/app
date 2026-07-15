using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;

namespace PrintForge.Services.Interfaces;

public interface IB2bService
{
    // Dashboard / analytics
    Task<object> GetDashboardAsync();
    Task<object> GetAnalyticsAsync();

    // Categories
    Task<object> ListCategoriesAsync(bool includeArchived = false, bool tree = true);
    Task<Dictionary<string, object?>> GetCategoryAsync(string idOrSlug);
    Task<Dictionary<string, object?>> CreateCategoryAsync(User user, B2bCategoryRequest request);
    Task<Dictionary<string, object?>> UpdateCategoryAsync(User user, string id, Dictionary<string, object?> payload);
    Task DeleteCategoryAsync(User user, string id);
    Task<object> DuplicateCategoryAsync(User user, string id);
    Task ReorderCategoriesAsync(User user, List<Dictionary<string, object?>> items);

    // Products
    Task<object> ListProductsAsync(
        string? categoryId, string? q, string? material, string? color,
        double? minPrice, double? maxPrice, int? maxMoq,
        bool? featured, bool? bestSeller, bool? newArrival, bool? customization,
        string? status, bool? visibleOnly, string? sort, int limit, int skip);
    Task<object> GetProductAsync(string slugOrId, bool trackView = false);
    Task<Dictionary<string, object?>> CreateProductAsync(User user, B2bProductRequest request);
    Task<Dictionary<string, object?>> UpdateProductAsync(User user, string id, Dictionary<string, object?> payload);
    Task DeleteProductAsync(User user, string id);
    Task<object> DuplicateProductAsync(User user, string id);

    // Catalog export payload (PDF built client-side)
    Task<object> GetCatalogExportAsync(B2bCatalogExportRequest request);

    // Quotes
    Task<object> ListQuotesAsync(string? status, int limit, int skip);
    Task<Dictionary<string, object?>> CreateQuoteAsync(B2bQuoteRequestDto request);
    Task<Dictionary<string, object?>> UpdateQuoteAsync(User user, string id, Dictionary<string, object?> payload);
    Task DeleteQuoteAsync(User user, string id);

    // Dealers
    Task<object> ListDealersAsync(string? status, int limit, int skip);
    Task<Dictionary<string, object?>> CreateDealerAsync(B2bDealerRequest request);
    Task<Dictionary<string, object?>> UpdateDealerAsync(User user, string id, Dictionary<string, object?> payload);
    Task DeleteDealerAsync(User user, string id);

    // Analytics track + settings
    Task TrackEventAsync(B2bAnalyticsTrackRequest request, string? ipHash = null);
    Task<Dictionary<string, object?>> GetSettingsAsync();
    Task<Dictionary<string, object?>> UpdateSettingsAsync(User user, B2bSettingsRequest request);
}

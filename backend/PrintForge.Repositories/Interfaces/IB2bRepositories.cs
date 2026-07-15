using PrintForge.Models.Entities;

namespace PrintForge.Repositories.Interfaces;

public record B2bProductQuery(
    string? CategoryId = null,
    string? SubcategoryId = null,
    string? Query = null,
    string? Material = null,
    string? Color = null,
    double? MinPrice = null,
    double? MaxPrice = null,
    int? MaxMoq = null,
    bool? Featured = null,
    bool? BestSeller = null,
    bool? NewArrival = null,
    bool? Customization = null,
    string? Status = null,
    bool? VisibleOnly = null,
    string? Sort = null,
    int Limit = 60,
    int Skip = 0);

public interface IB2bCategoryRepository
{
    Task<List<B2bCategory>> ListAsync(bool includeArchived = false);
    Task<B2bCategory?> FindByIdAsync(string id);
    Task<B2bCategory?> FindBySlugAsync(string slug);
    Task InsertAsync(B2bCategory category);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task DeleteAsync(string id);
    Task<long> CountAsync(string? status = null, string? visibility = null);
    Task ReorderAsync(IReadOnlyList<(string Id, int Order)> items);
}

public interface IB2bProductRepository
{
    Task<(List<B2bProduct> Items, long Total)> ListAsync(B2bProductQuery query);
    Task<B2bProduct?> FindByIdAsync(string id);
    Task<B2bProduct?> FindBySlugAsync(string slug);
    Task<B2bProduct?> FindBySlugOrIdAsync(string slugOrId);
    Task InsertAsync(B2bProduct product);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task DeleteAsync(string id);
    Task<long> CountAsync(string? status = null, bool? visible = null, bool? featured = null, bool? bestSeller = null);
    Task IncrementCounterAsync(string id, string column, long delta = 1);
    Task<List<B2bProduct>> FindByIdsAsync(IEnumerable<string> ids);
    Task<List<B2bProduct>> FindRelatedAsync(string? categoryId, string excludeId, int limit = 6);
    Task<B2bProduct?> FindTopByCounterAsync(string column);
}

public interface IB2bQuoteRepository
{
    Task<(List<B2bQuoteRequest> Items, long Total)> ListAsync(string? status, int limit, int skip);
    Task<B2bQuoteRequest?> FindByIdAsync(string id);
    Task InsertAsync(B2bQuoteRequest quote);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task DeleteAsync(string id);
    Task<long> CountAsync(string? status = null);
}

public interface IB2bDealerRepository
{
    Task<(List<B2bDealer> Items, long Total)> ListAsync(string? status, int limit, int skip);
    Task<B2bDealer?> FindByIdAsync(string id);
    Task InsertAsync(B2bDealer dealer);
    Task UpdateAsync(string id, Dictionary<string, object?> updates);
    Task DeleteAsync(string id);
    Task<long> CountAsync(string? status = null);
}

public interface IB2bAnalyticsRepository
{
    Task InsertAsync(B2bAnalyticsEvent evt);
    Task<long> CountDownloadsAsync(DateTime? from = null, DateTime? to = null);
    Task<long> CountEventsAsync(string eventType, DateTime? from = null, DateTime? to = null);
    Task<List<(string Date, long Count)>> SeriesAsync(string eventType, int days);
    Task<List<(string Id, string Name, long Count)>> TopProductsAsync(string eventType, int limit = 10);
    Task<List<(string Id, string Name, long Count)>> TopCategoriesAsync(int limit = 10);
    Task<List<(string Device, long Count)>> DeviceBreakdownAsync();
    Task<List<(string Country, long Count)>> CountryBreakdownAsync();
}

public interface IB2bSettingsRepository
{
    Task<B2bSettings> GetAsync();
    Task UpdateAsync(Dictionary<string, object?> updates);
}

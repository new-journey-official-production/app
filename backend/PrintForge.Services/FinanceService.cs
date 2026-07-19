using PrintForge.Models;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

public interface IFinanceService
{
    Task<Dictionary<string, object?>> GetOverviewAsync();
    Task<List<Dictionary<string, object?>>> ListEntriesAsync(string? kind);
    Task<Dictionary<string, object?>> CreateEntryAsync(User user, Dictionary<string, object?> payload);
    Task<Dictionary<string, object?>> UpdateEntryAsync(string id, Dictionary<string, object?> payload);
    Task DeleteEntryAsync(string id);
}

/// <summary>Company accounts — expenses, income, bills, and order payment overview.</summary>
public class FinanceService(
    IFinanceRepository finance,
    IPaymentRepository payments,
    IOrderRepository orders) : IFinanceService
{
    private static readonly HashSet<string> AllowedKinds = new(StringComparer.OrdinalIgnoreCase) { "expense", "income", "bill" };
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase) { "pending", "paid", "received", "cancelled" };

    public async Task<Dictionary<string, object?>> GetOverviewAsync()
    {
        var ledger = await finance.SummaryAsync();
        var allOrders = await orders.ListAllAsync();
        var orderRevenue = Math.Round(allOrders.Where(o => o.Status != "cancelled").Sum(o => o.Total), 2);
        var pendingPayments = await payments.AdminListAsync("pending", null, 500);

        return new Dictionary<string, object?>
        {
            ["ledger"] = ledger,
            ["order_revenue"] = orderRevenue,
            ["order_count"] = allOrders.Count,
            ["pending_order_payments"] = pendingPayments.Count,
            ["pending_order_payment_total"] = Math.Round(pendingPayments.Sum(p => p.Amount), 2),
        };
    }

    public async Task<List<Dictionary<string, object?>>> ListEntriesAsync(string? kind)
    {
        var items = await finance.ListAsync(kind);
        return items.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<Dictionary<string, object?>> CreateEntryAsync(User user, Dictionary<string, object?> payload)
    {
        var kind = payload.GetValueOrDefault("kind")?.ToString()?.ToLowerInvariant() ?? "expense";
        if (!AllowedKinds.Contains(kind))
            throw new InvalidOperationException("Invalid entry kind");

        var status = payload.GetValueOrDefault("status")?.ToString()?.ToLowerInvariant() ?? "pending";
        if (!AllowedStatuses.Contains(status))
            throw new InvalidOperationException("Invalid status");

        var entry = new FinanceEntry
        {
            Id = IdHelper.NewId(),
            Kind = kind,
            Title = payload.GetValueOrDefault("title")?.ToString()?.Trim() ?? "Untitled",
            Amount = Convert.ToDouble(payload.GetValueOrDefault("amount") ?? 0),
            Category = payload.GetValueOrDefault("category")?.ToString()?.Trim() ?? "",
            Status = status,
            ReferenceId = payload.GetValueOrDefault("reference_id")?.ToString()?.Trim() ?? "",
            DueDate = payload.GetValueOrDefault("due_date")?.ToString()?.Trim() ?? "",
            PaidAt = payload.GetValueOrDefault("paid_at")?.ToString()?.Trim() ?? "",
            Notes = payload.GetValueOrDefault("notes")?.ToString()?.Trim() ?? "",
            CreatedBy = user.Email,
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso(),
        };

        if (entry.Amount <= 0)
            throw new InvalidOperationException("Amount must be greater than zero");

        await finance.InsertAsync(entry);
        return BsonMapper.ToDict(entry);
    }

    public async Task<Dictionary<string, object?>> UpdateEntryAsync(string id, Dictionary<string, object?> payload)
    {
        var allowed = new HashSet<string> { "title", "amount", "category", "status", "reference_id", "due_date", "paid_at", "notes" };
        var updates = payload.Where(kv => allowed.Contains(kv.Key)).ToDictionary(kv => kv.Key, kv => kv.Value);

        if (updates.TryGetValue("status", out var st) && st is string statusStr && !AllowedStatuses.Contains(statusStr))
            throw new InvalidOperationException("Invalid status");

        if (updates.Count == 0)
            throw new InvalidOperationException("No valid fields to update");

        updates["updated_at"] = IdHelper.NowIso();
        await finance.UpdateAsync(id, updates);
        var entry = await finance.FindByIdAsync(id) ?? throw new KeyNotFoundException("Entry not found");
        return BsonMapper.ToDict(entry);
    }

    public async Task DeleteEntryAsync(string id)
    {
        if (await finance.FindByIdAsync(id) is null)
            throw new KeyNotFoundException("Entry not found");
        await finance.DeleteAsync(id);
    }
}

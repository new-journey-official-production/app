using PrintForge.Models;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

/// <summary>Admin billing — payment listing, status updates, order billing detail for invoices.</summary>
public class BillingService(IPaymentRepository payments, IOrderRepository orders) : IBillingService
{
    private static readonly HashSet<string> AllowedStatuses =
        new(StringComparer.OrdinalIgnoreCase) { "pending", "paid", "failed", "refunded" };

    public async Task<List<Dictionary<string, object?>>> AdminListAsync(string? status, string? q, int limit)
    {
        var rows = await payments.AdminListAsync(status, q, limit);
        return rows.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<Dictionary<string, object?>> UpdateStatusAsync(User user, string paymentId, string status)
    {
        if (!AllowedStatuses.Contains(status))
            throw new InvalidOperationException("Invalid payment status");

        var payment = await payments.FindByIdAsync(paymentId)
            ?? throw new KeyNotFoundException("Payment not found");

        await payments.UpdateStatusAsync(paymentId, status.ToLowerInvariant());
        payment.Status = status.ToLowerInvariant();
        return BsonMapper.ToDict(payment);
    }

    public async Task<Dictionary<string, object?>> GetOrderBillingAsync(string orderId)
    {
        var order = await orders.FindByIdAsync(orderId)
            ?? throw new KeyNotFoundException("Order not found");
        var payment = await payments.FindByOrderIdAsync(orderId);

        return new Dictionary<string, object?>
        {
            ["order"] = BsonMapper.ToDict(order),
            ["payment"] = payment is null ? null : BsonMapper.ToDict(payment),
        };
    }
}

using PrintForge.Constants;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

/// <summary>
/// Admin billing + payment approval workflow.
/// Approving a verified UPI payment advances the linked order into production.
/// </summary>
public class BillingService(
    IPaymentRepository payments,
    IOrderRepository orders,
    IProductRepository products,
    IActivityLogService activity,
    INotificationRepository notifications) : IBillingService
{
    private static readonly HashSet<string> AllowedStatuses =
        new(BackendConstants.PaymentStatuses, StringComparer.OrdinalIgnoreCase);

    public async Task<List<Dictionary<string, object?>>> AdminListAsync(
        string? status, string? q, int limit, string? method = null, string? fromDate = null, string? toDate = null)
    {
        var rows = await payments.AdminListAsync(status, q, limit, method, fromDate, toDate);
        return rows.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<Dictionary<string, object?>> UpdateStatusAsync(User user, string paymentId, string status)
    {
        if (!AllowedStatuses.Contains(status))
            throw new InvalidOperationException("Invalid payment status");

        var payment = await payments.FindByIdAsync(paymentId)
            ?? throw new KeyNotFoundException("Payment not found");

        var normalized = status.ToLowerInvariant();
        await payments.UpdateStatusAsync(paymentId, normalized);
        payment.Status = normalized;
        await activity.LogAsync(user, "payment.status", paymentId, new Dictionary<string, object?>
        {
            ["status"] = normalized,
            ["order_id"] = payment.OrderId
        });
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

    public async Task<Dictionary<string, object?>> GetApprovalSummaryAsync() =>
        await payments.GetApprovalSummaryAsync();

    public async Task<Dictionary<string, object?>> GetPaymentAnalyticsAsync(
        string? status, string? method, string? fromDate, string? toDate) =>
        await payments.GetPaymentAnalyticsAsync(status, method, fromDate, toDate);

    public async Task<Dictionary<string, object?>> SubmitProofAsync(User user, string orderId, SubmitPaymentProofRequest request)
    {
        var order = await orders.FindByIdForUserAsync(orderId, user.Id)
            ?? throw new KeyNotFoundException("Order not found");
        var payment = await payments.FindByOrderIdAsync(orderId)
            ?? throw new KeyNotFoundException("Payment not found");

        if (!BackendConstants.ManualUpiMethods.Contains(payment.Method))
            throw new InvalidOperationException("Payment proof is only accepted for UPI payments");
        if (payment.Status is "approved" or "paid")
            throw new InvalidOperationException("Payment is already approved");
        if (payment.Status == "verification_pending")
            throw new InvalidOperationException("Payment proof already submitted and awaiting verification");

        var now = IdHelper.NowIso();
        await payments.UpdateAsync(payment.Id, new Dictionary<string, object?>
        {
            ["upi_transaction_id"] = request.UpiTransactionId.Trim(),
            ["screenshot_url"] = request.ScreenshotUrl.Trim(),
            ["payment_note"] = request.PaymentNote?.Trim() ?? "",
            ["submitted_at"] = now,
            ["status"] = "verification_pending",
            ["rejection_reason"] = "",
            ["transaction_id"] = request.UpiTransactionId.Trim(),
        });

        await orders.PushTimelineAsync(orderId, new OrderTimelineEntry
        {
            Status = "placed",
            At = now,
            Note = "Payment proof submitted — verification pending"
        }, order.Status);

        await activity.LogAsync(user, "payment.proof_submit", payment.Id, new Dictionary<string, object?>
        {
            ["order_id"] = orderId,
            ["order_no"] = order.OrderNo,
            ["upi_transaction_id"] = request.UpiTransactionId.Trim()
        });

        var updated = await payments.FindByIdAsync(payment.Id) ?? payment;
        return BsonMapper.ToDict(updated);
    }

    public async Task<Dictionary<string, object?>> ApproveAsync(User user, string paymentId)
    {
        var payment = await payments.FindByIdAsync(paymentId)
            ?? throw new KeyNotFoundException("Payment not found");
        if (payment.Status is not ("verification_pending" or "pending"))
            throw new InvalidOperationException("Only pending or verification-pending payments can be approved");

        var order = await orders.FindByIdAsync(payment.OrderId)
            ?? throw new KeyNotFoundException("Order not found");
        if (order.Status == "cancelled")
            throw new InvalidOperationException("Cannot approve payment for a cancelled order");

        var now = IdHelper.NowIso();
        await payments.UpdateAsync(paymentId, new Dictionary<string, object?>
        {
            ["status"] = "approved",
            ["verified_by"] = user.Email,
            ["verified_date"] = now,
            ["rejection_reason"] = "",
        });

        // Move order into production workflow once payment is confirmed.
        if (order.Status == "placed")
        {
            await orders.PushTimelineAsync(order.Id, new OrderTimelineEntry
            {
                Status = "payment_received",
                At = now,
                Note = $"Payment approved by {user.Email}"
            }, "payment_received");
            await orders.PushTimelineAsync(order.Id, new OrderTimelineEntry
            {
                Status = "accepted",
                At = now,
                Note = "Order confirmed — queued for production"
            }, "accepted");
        }

        await notifications.InsertAsync(new Notification
        {
            Id = IdHelper.NewId(),
            UserId = order.UserId,
            Title = "Payment approved",
            Message = $"Payment for order {order.OrderNo} has been verified. Production will begin shortly.",
            Kind = "payment",
            RefId = order.Id,
            Read = false,
            CreatedAt = now
        });

        await activity.LogAsync(user, "payment.approve", paymentId, new Dictionary<string, object?>
        {
            ["order_id"] = order.Id,
            ["order_no"] = order.OrderNo,
            ["amount"] = payment.Amount
        });

        return await GetOrderBillingAsync(order.Id);
    }

    public async Task<Dictionary<string, object?>> RejectAsync(User user, string paymentId, RejectPaymentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new InvalidOperationException("Rejection reason is required");
        if (!BackendConstants.PaymentRejectionReasons.Contains(request.Reason)
            && request.Reason.Length < 3)
            throw new InvalidOperationException("Invalid rejection reason");

        var payment = await payments.FindByIdAsync(paymentId)
            ?? throw new KeyNotFoundException("Payment not found");
        if (payment.Status is "approved" or "paid")
            throw new InvalidOperationException("Approved payments cannot be rejected");

        var order = await orders.FindByIdAsync(payment.OrderId)
            ?? throw new KeyNotFoundException("Order not found");

        var now = IdHelper.NowIso();
        await payments.UpdateAsync(paymentId, new Dictionary<string, object?>
        {
            ["status"] = "rejected",
            ["verified_by"] = user.Email,
            ["verified_date"] = now,
            ["rejection_reason"] = request.Reason.Trim(),
        });

        if (order.Status != "cancelled")
        {
            foreach (var it in order.Items)
                await products.IncrementStockAsync(it.ProductId, it.Quantity);
        }

        await orders.PushTimelineAsync(order.Id, new OrderTimelineEntry
        {
            Status = "cancelled",
            At = now,
            Note = $"Payment rejected: {request.Reason.Trim()}"
        }, "cancelled");

        await notifications.InsertAsync(new Notification
        {
            Id = IdHelper.NewId(),
            UserId = order.UserId,
            Title = "Payment failed",
            Message = $"Payment for order {order.OrderNo} was rejected. Reason: {request.Reason.Trim()}",
            Kind = "payment",
            RefId = order.Id,
            Read = false,
            CreatedAt = now
        });

        await activity.LogAsync(user, "payment.reject", paymentId, new Dictionary<string, object?>
        {
            ["order_id"] = order.Id,
            ["order_no"] = order.OrderNo,
            ["reason"] = request.Reason.Trim()
        });

        return await GetOrderBillingAsync(order.Id);
    }
}

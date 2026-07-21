using PrintForge.Constants;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

/// <summary>
/// Gateway-agnostic payment orchestration. Manual UPI creates pending charges;
/// future Razorpay/Cashfree providers can plug in without changing order create flow.
/// </summary>
public class PaymentService(
    IPaymentRepository payments,
    IPaymentConfigurationRepository configs) : IPaymentService
{
    public async Task<Payment> ChargeAsync(string orderId, string method, double amount, string? orderNo = null)
    {
        var normalized = (method ?? "").Trim().ToLowerInvariant();
        var status = ResolveInitialStatus(normalized);
        var gateway = ResolveGatewayProvider(normalized);

        // Amount limits from active UPI config (when applicable).
        if (BackendConstants.ManualUpiMethods.Contains(normalized))
        {
            var cfg = await configs.FindActiveByTypeAsync("upi");
            if (cfg is not null)
            {
                if (cfg.MinAmount is not null && amount < cfg.MinAmount.Value)
                    throw new InvalidOperationException($"Minimum payment amount is {cfg.MinAmount.Value}");
                if (cfg.MaxAmount is not null && amount > cfg.MaxAmount.Value)
                    throw new InvalidOperationException($"Maximum payment amount is {cfg.MaxAmount.Value}");
            }
        }

        var payment = new Payment
        {
            Id = IdHelper.NewId(),
            OrderId = orderId,
            Method = normalized,
            Amount = amount,
            Status = status,
            TransactionId = status == "pending" ? "" : $"TXN-{IdHelper.NewId()[..8].ToUpperInvariant()}",
            GatewayProvider = gateway,
            QrPayload = "",
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso()
        };

        if (BackendConstants.ManualUpiMethods.Contains(normalized) && !string.IsNullOrWhiteSpace(orderNo))
        {
            var cfg = await configs.FindActiveByTypeAsync("upi")
                ?? throw new InvalidOperationException("No active UPI payment configuration found");
            payment.QrPayload = BuildUpiPayUrl(cfg, amount, orderNo);
        }

        await payments.InsertAsync(payment);
        return payment;
    }

    public static string BuildUpiPayUrl(PaymentConfiguration cfg, double amount, string orderNo)
    {
        var am = amount.ToString("0.##", System.Globalization.CultureInfo.InvariantCulture);
        var tn = $"Order-{orderNo}";
        return "upi://pay?"
            + $"pa={Uri.EscapeDataString(cfg.UpiId)}"
            + $"&pn={Uri.EscapeDataString(cfg.MerchantName)}"
            + $"&am={Uri.EscapeDataString(am)}"
            + "&cu=INR"
            + $"&tn={Uri.EscapeDataString(tn)}";
    }

    private static string ResolveInitialStatus(string method) =>
        method switch
        {
            "cod" => "pending",
            _ when BackendConstants.ManualUpiMethods.Contains(method) => "pending",
            // Future automatic gateways would return provider-confirmed status here.
            _ => "pending"
        };

    private static string ResolveGatewayProvider(string method) =>
        method switch
        {
            "cod" => "cod",
            _ when BackendConstants.ManualUpiMethods.Contains(method) => "upi_manual",
            _ => "manual"
        };
}

/// <summary>CRUD for payment method masters (UPI / future gateway / COD).</summary>
public class PaymentConfigurationService(
    IPaymentConfigurationRepository configs,
    IActivityLogService activity) : IPaymentConfigurationService
{
    private static readonly HashSet<string> AllowedTypes = new(BackendConstants.PaymentMethodTypes, StringComparer.OrdinalIgnoreCase);
    private static readonly HashSet<string> AllowedQr = new(StringComparer.OrdinalIgnoreCase) { "dynamic", "static" };
    private static readonly HashSet<string> AllowedStatus = new(StringComparer.OrdinalIgnoreCase) { "active", "inactive" };

    public async Task<List<Dictionary<string, object?>>> ListAsync(bool activeOnly = false)
    {
        var rows = await configs.ListAsync(activeOnly);
        return rows.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<Dictionary<string, object?>> GetAsync(string id)
    {
        var row = await configs.FindByIdAsync(id) ?? throw new KeyNotFoundException("Not found");
        return BsonMapper.ToDict(row);
    }

    public async Task<Dictionary<string, object?>> GetActiveUpiAsync()
    {
        var row = await configs.FindActiveByTypeAsync("upi")
            ?? throw new KeyNotFoundException("No active UPI configuration");
        return BsonMapper.ToDict(row);
    }

    public async Task<Dictionary<string, object?>> CreateAsync(User user, PaymentConfigurationRequest request)
    {
        Validate(request);
        // Only UPI is enabled for create initially — gateways/COD reserved for future.
        if (!string.Equals(request.PaymentMethodType, "upi", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only UPI payment method type can be enabled currently");

        var doc = new PaymentConfiguration
        {
            Id = IdHelper.NewId(),
            PaymentMethodName = request.PaymentMethodName.Trim(),
            PaymentMethodType = request.PaymentMethodType.Trim().ToLowerInvariant(),
            Status = NormalizeStatus(request.Status),
            MerchantName = request.MerchantName.Trim(),
            BusinessName = request.BusinessName.Trim(),
            UpiId = request.UpiId.Trim(),
            QrType = NormalizeQr(request.QrType),
            StaticQrUrl = request.StaticQrUrl?.Trim() ?? "",
            Instructions = request.Instructions?.Trim() ?? "",
            MinAmount = request.MinAmount,
            MaxAmount = request.MaxAmount,
            DisplayOrder = request.DisplayOrder,
            GatewayProvider = request.GatewayProvider?.Trim() ?? "",
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso()
        };
        await configs.InsertAsync(doc);
        await activity.LogAsync(user, "payment_config.create", doc.Id, new Dictionary<string, object?>
        {
            ["name"] = doc.PaymentMethodName,
            ["type"] = doc.PaymentMethodType
        });
        return BsonMapper.ToDict(doc);
    }

    public async Task<Dictionary<string, object?>> UpdateAsync(User user, string id, PaymentConfigurationRequest request)
    {
        _ = await configs.FindByIdAsync(id) ?? throw new KeyNotFoundException("Not found");
        Validate(request);
        if (!string.Equals(request.PaymentMethodType, "upi", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only UPI payment method type can be enabled currently");

        var updates = new Dictionary<string, object?>
        {
            ["payment_method_name"] = request.PaymentMethodName.Trim(),
            ["payment_method_type"] = request.PaymentMethodType.Trim().ToLowerInvariant(),
            ["status"] = NormalizeStatus(request.Status),
            ["merchant_name"] = request.MerchantName.Trim(),
            ["business_name"] = request.BusinessName.Trim(),
            ["upi_id"] = request.UpiId.Trim(),
            ["qr_type"] = NormalizeQr(request.QrType),
            ["static_qr_url"] = request.StaticQrUrl?.Trim() ?? "",
            ["instructions"] = request.Instructions?.Trim() ?? "",
            ["min_amount"] = request.MinAmount,
            ["max_amount"] = request.MaxAmount,
            ["display_order"] = request.DisplayOrder,
            ["gateway_provider"] = request.GatewayProvider?.Trim() ?? "",
        };
        await configs.UpdateAsync(id, updates);
        await activity.LogAsync(user, "payment_config.update", id);
        var row = await configs.FindByIdAsync(id) ?? throw new KeyNotFoundException("Not found");
        return BsonMapper.ToDict(row);
    }

    public async Task DeleteAsync(User user, string id)
    {
        _ = await configs.FindByIdAsync(id) ?? throw new KeyNotFoundException("Not found");
        await configs.DeleteAsync(id);
        await activity.LogAsync(user, "payment_config.delete", id);
    }

    private static void Validate(PaymentConfigurationRequest request)
    {
        if (!AllowedTypes.Contains(request.PaymentMethodType))
            throw new InvalidOperationException("Invalid payment method type");
        if (!AllowedQr.Contains(request.QrType))
            throw new InvalidOperationException("Invalid QR type");
        if (!AllowedStatus.Contains(request.Status))
            throw new InvalidOperationException("Invalid status");
        if (string.Equals(request.PaymentMethodType, "upi", StringComparison.OrdinalIgnoreCase)
            && string.IsNullOrWhiteSpace(request.UpiId))
            throw new InvalidOperationException("UPI ID is required for UPI payment methods");
        if (string.Equals(request.QrType, "static", StringComparison.OrdinalIgnoreCase)
            && string.IsNullOrWhiteSpace(request.StaticQrUrl))
            throw new InvalidOperationException("Static QR image is required when QR type is static");
        if (request.MinAmount is not null && request.MaxAmount is not null && request.MinAmount > request.MaxAmount)
            throw new InvalidOperationException("Minimum amount cannot exceed maximum amount");
    }

    private static string NormalizeStatus(string status) =>
        AllowedStatus.Contains(status) ? status.ToLowerInvariant() : "inactive";

    private static string NormalizeQr(string qr) =>
        AllowedQr.Contains(qr) ? qr.ToLowerInvariant() : "dynamic";
}

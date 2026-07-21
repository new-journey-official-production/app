using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

/// <summary>
/// Dispatches customer notifications according to admin-configured rules.
/// Channels: email (existing mock/provider), in-app, SMS stub (uses User.Phone until a provider is wired).
/// </summary>
public class NotificationDispatchService(
    INotificationConfigurationRepository configs,
    INotificationRepository notifications,
    IEmailService email,
    IUserRepository users,
    IActivityLogService activity,
    ILogger<NotificationDispatchService> logger) : INotificationDispatchService
{
    public async Task DispatchAsync(string eventKey, Order order, Dictionary<string, object?>? extra = null)
    {
        var rule = await configs.FindByEventKeyAsync(eventKey);
        if (rule is null || !rule.Enabled) return;

        var user = await users.FindByIdAsync(order.UserId);
        if (user is null) return;

        var vars = BuildVars(user, order, eventKey, extra);
        var title = Render(rule.TitleTemplate, vars);
        var body = Render(rule.BodyTemplate, vars);

        if (rule.ChannelInApp)
        {
            await notifications.InsertAsync(new Notification
            {
                Id = IdHelper.NewId(),
                UserId = user.Id,
                Title = title,
                Message = body,
                Kind = eventKey.StartsWith("payment_", StringComparison.Ordinal) ? "payment" : "order",
                RefId = order.Id,
                Read = false,
                CreatedAt = IdHelper.NowIso()
            });
        }

        if (rule.ChannelEmail && !string.IsNullOrWhiteSpace(user.Email))
        {
            await email.SendAsync(user.Email, "order_status", new Dictionary<string, object?>
            {
                ["order_no"] = order.OrderNo,
                ["status"] = eventKey,
                ["total"] = order.Total,
                ["name"] = user.Name,
                ["title"] = title,
                ["body"] = body,
                ["phone"] = user.Phone ?? ""
            });
        }

        if (rule.ChannelSms)
        {
            // SMS provider not integrated yet — log intent with customer phone for future Twilio/etc.
            var phone = !string.IsNullOrWhiteSpace(user.Phone) ? user.Phone : order.Address?.Phone;
            if (!string.IsNullOrWhiteSpace(phone))
            {
                logger.LogInformation(
                    "[SMS:pending] To={Phone} Event={Event} Order={OrderNo} Body={Body}",
                    phone, eventKey, order.OrderNo, body);
                await activity.LogAsync(null, "notification.sms_pending", order.Id, new Dictionary<string, object?>
                {
                    ["event_key"] = eventKey,
                    ["phone"] = phone,
                    ["body"] = body
                });
            }
            else
            {
                logger.LogWarning("SMS enabled for {Event} but user {UserId} has no phone number", eventKey, user.Id);
            }
        }
    }

    public async Task<List<Dictionary<string, object?>>> ListConfigsAsync()
    {
        var rows = await configs.ListAsync();
        return rows.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<Dictionary<string, object?>> UpdateConfigAsync(User admin, string id, NotificationConfigurationRequest request)
    {
        _ = await configs.FindByIdAsync(id) ?? throw new KeyNotFoundException("Not found");
        await configs.UpdateAsync(id, new Dictionary<string, object?>
        {
            ["event_name"] = request.EventName.Trim(),
            ["description"] = request.Description?.Trim() ?? "",
            ["enabled"] = request.Enabled,
            ["channel_email"] = request.ChannelEmail,
            ["channel_in_app"] = request.ChannelInApp,
            ["channel_sms"] = request.ChannelSms,
            ["title_template"] = request.TitleTemplate.Trim(),
            ["body_template"] = request.BodyTemplate.Trim(),
            ["display_order"] = request.DisplayOrder,
        });
        await activity.LogAsync(admin, "notification_config.update", id, new Dictionary<string, object?>
        {
            ["enabled"] = request.Enabled,
            ["channel_email"] = request.ChannelEmail,
            ["channel_sms"] = request.ChannelSms,
        });
        var row = await configs.FindByIdAsync(id) ?? throw new KeyNotFoundException("Not found");
        return BsonMapper.ToDict(row);
    }

    private static Dictionary<string, string> BuildVars(
        User user, Order order, string eventKey, Dictionary<string, object?>? extra)
    {
        var vars = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["name"] = user.Name ?? "",
            ["email"] = user.Email ?? "",
            ["phone"] = user.Phone ?? order.Address?.Phone ?? "",
            ["order_no"] = order.OrderNo ?? "",
            ["order_id"] = order.Id ?? "",
            ["status"] = eventKey,
            ["total"] = order.Total.ToString("0.##"),
            ["payment_method"] = order.PaymentMethod ?? "",
        };
        if (extra is not null)
        {
            foreach (var kv in extra)
                vars[kv.Key] = kv.Value?.ToString() ?? "";
        }
        return vars;
    }

    private static string Render(string template, Dictionary<string, string> vars) =>
        Regex.Replace(template ?? "", @"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}", m =>
        {
            var key = m.Groups[1].Value;
            return vars.TryGetValue(key, out var val) ? val : m.Value;
        });
}

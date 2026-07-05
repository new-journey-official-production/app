using PrintForge.Constants;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

public class OrderService(
    IOrderRepository orders,
    IProductRepository products,
    IAddressRepository addresses,
    ICouponService coupons,
    IPaymentService payments,
    IEmailService email,
    IUserRepository users,
    INotificationRepository notifications,
    IActivityLogService activity) : IOrderService
{
    public async Task<Dictionary<string, object?>> CreateAsync(User user, OrderCreateRequest request)
    {
        if (request.Items.Count == 0) throw new InvalidOperationException("Empty order");

        var address = await addresses.FindByIdAndUserAsync(request.AddressId, user.Id)
            ?? throw new InvalidOperationException("Address not found");

        var lineItems = new List<OrderItem>();
        foreach (var it in request.Items)
        {
            var p = await products.FindByIdAsync(it.ProductId)
                ?? throw new InvalidOperationException($"Product {it.ProductId} not found");
            if (p.Stock < it.Quantity)
                throw new InvalidOperationException($"Insufficient stock for {p.Name}");

            lineItems.Add(new OrderItem
            {
                ProductId = p.Id,
                Name = p.Name,
                Image = p.Images.FirstOrDefault(),
                Slug = p.Slug,
                Price = p.DiscountPrice ?? p.Price,
                Quantity = it.Quantity,
                Variant = it.Variant
            });
        }

        var discount = 0.0;
        string? couponCode = null;
        if (!string.IsNullOrEmpty(request.CouponCode))
        {
            try
            {
                var sub = lineItems.Sum(i => i.Price * i.Quantity);
                var result = await coupons.ValidateAsync(request.CouponCode, sub);
                discount = result.Discount;
                couponCode = result.Coupon["code"]?.ToString();
            }
            catch { /* ignore invalid coupon */ }
        }

        var totals = ComputeTotals(lineItems, discount);
        var orderId = IdHelper.NewId();
        var orderNo = BackendConstants.OrderNoPrefix + DateTime.UtcNow.ToString("yyMMdd") + "-" + IdHelper.NewId()[..5].ToUpperInvariant();

        var order = new Order
        {
            Id = orderId,
            OrderNo = orderNo,
            UserId = user.Id,
            UserEmail = user.Email,
            Items = lineItems,
            Address = address.ToEmbedded(),
            PaymentMethod = request.PaymentMethod,
            CouponCode = couponCode,
            Subtotal = totals.Subtotal,
            Shipping = totals.Shipping,
            Gst = totals.Gst,
            Discount = totals.Discount,
            Total = totals.Total,
            Status = "placed",
            Timeline = [new OrderTimelineEntry { Status = "placed", At = IdHelper.NowIso(), Note = "Order placed" }],
            Notes = request.Notes,
            Priority = "normal",
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso()
        };
        await orders.InsertAsync(order);

        foreach (var it in lineItems)
            await products.IncrementStockAsync(it.ProductId, -it.Quantity, it.Quantity);

        var payment = await payments.ChargeAsync(orderId, request.PaymentMethod, totals.Total);
        if (payment.Status == "paid")
            order = await AdvanceStatusAsync(orderId, "payment_received", $"Payment via {request.PaymentMethod}") ?? order;

        await email.SendAsync(user.Email, "order_confirmation", new Dictionary<string, object?>
        {
            ["order_no"] = orderNo, ["total"] = totals.Total
        });

        return BsonMapper.ToDict(order);
    }

    public async Task<List<Dictionary<string, object?>>> GetMyOrdersAsync(string userId)
    {
        var list = await orders.FindByUserAsync(userId);
        return list.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<Dictionary<string, object?>> GetOrderAsync(User user, string oid)
    {
        Order? o = user.Role == "customer"
            ? await orders.FindByIdForUserAsync(oid, user.Id)
            : await orders.FindByIdAsync(oid);
        return o is null ? throw new KeyNotFoundException("Not found") : BsonMapper.ToDict(o);
    }

    public async Task<List<Dictionary<string, object?>>> AdminListAsync(string? status, string? q, int limit)
    {
        var list = await orders.AdminListAsync(status, q, limit);
        return list.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<Dictionary<string, object?>> AdminUpdateStatusAsync(User user, string oid, Dictionary<string, object?> payload)
    {
        var status = payload.GetValueOrDefault("status")?.ToString()
            ?? throw new InvalidOperationException("Invalid status");
        if (!BackendConstants.OrderStatuses.Contains(status))
            throw new InvalidOperationException("Invalid status");

        var order = await AdvanceStatusAsync(oid, status, payload.GetValueOrDefault("note")?.ToString() ?? "")
            ?? throw new KeyNotFoundException("Order not found");

        if (status == "cancelled")
        {
            foreach (var it in order.Items)
                await products.IncrementStockAsync(it.ProductId, it.Quantity);
        }

        await activity.LogAsync(user, "order.status", oid, new Dictionary<string, object?>
        {
            ["order_no"] = order.OrderNo, ["status"] = status
        });
        return BsonMapper.ToDict(order);
    }

    public async Task<Dictionary<string, object?>> AdminUpdateAsync(string oid, Dictionary<string, object?> payload)
    {
        var allowed = new HashSet<string> { "priority", "printer_id", "notes" };
        var updates = payload.Where(kv => allowed.Contains(kv.Key)).ToDictionary(kv => kv.Key, kv => kv.Value);
        updates["updated_at"] = IdHelper.NowIso();
        await orders.UpdateAsync(oid, updates);
        var o = await orders.FindByIdAsync(oid) ?? throw new KeyNotFoundException("Not found");
        return BsonMapper.ToDict(o);
    }

    private async Task<Order?> AdvanceStatusAsync(string orderId, string newStatus, string note)
    {
        var order = await orders.FindByIdAsync(orderId);
        if (order is null) return null;

        var entry = new OrderTimelineEntry { Status = newStatus, At = IdHelper.NowIso(), Note = note };
        await orders.PushTimelineAsync(orderId, entry, newStatus);
        order = await orders.FindByIdAsync(orderId);
        if (order is not null) await DispatchOrderEventAsync(order, newStatus);
        return order;
    }

    private async Task DispatchOrderEventAsync(Order order, string eventStatus)
    {
        var user = await users.FindByIdAsync(order.UserId);
        if (user is null) return;

        await email.SendAsync(user.Email, "order_status", new Dictionary<string, object?>
        {
            ["order_no"] = order.OrderNo, ["status"] = eventStatus, ["total"] = order.Total, ["name"] = user.Name
        });

        await notifications.InsertAsync(new Notification
        {
            Id = IdHelper.NewId(),
            UserId = user.Id,
            Title = $"Order {order.OrderNo} — {eventStatus}",
            Message = $"Your order status is now {eventStatus}.",
            Kind = "order",
            RefId = order.Id,
            Read = false,
            CreatedAt = IdHelper.NowIso()
        });
    }

    private static (double Subtotal, double Shipping, double Gst, double Discount, double Total) ComputeTotals(
        List<OrderItem> items, double discount)
    {
        var subtotal = items.Sum(i => i.Price * i.Quantity);
        // GST and shipping disabled for early launch.
        var shipping = 0.0;
        var gst = 0.0;
        var total = Math.Round(subtotal - discount, 2);
        return (Math.Round(subtotal, 2), shipping, gst, Math.Round(discount, 2), total);
    }
}

public class AnalyticsService(
    IOrderRepository orders,
    IInventoryRepository inventory,
    IUserRepository users) : IAnalyticsService
{
    public async Task<Dictionary<string, object?>> GetSummaryAsync()
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var allOrders = await orders.ListAllAsync();
        var todayOrders = allOrders.Where(o => o.CreatedAt.StartsWith(today)).ToList();
        var pending = allOrders.Where(o => !new[] { "delivered", "completed", "cancelled" }.Contains(o.Status)).ToList();

        var revenueByDay = new Dictionary<string, double>();
        var counter = new Dictionary<string, Dictionary<string, object?>>();

        foreach (var o in allOrders)
        {
            var d = o.CreatedAt[..10];
            revenueByDay[d] = revenueByDay.GetValueOrDefault(d) + o.Total;
            foreach (var it in o.Items)
            {
                if (!counter.TryGetValue(it.ProductId, out var entry))
                {
                    entry = new Dictionary<string, object?> { ["name"] = it.Name, ["count"] = 0, ["revenue"] = 0.0 };
                    counter[it.ProductId] = entry;
                }
                entry["count"] = (int)(entry["count"] ?? 0) + it.Quantity;
                entry["revenue"] = (double)(entry["revenue"] ?? 0.0) + it.Price * it.Quantity;
            }
        }

        var topProducts = counter.Values
            .OrderByDescending(v => (double)(v["revenue"] ?? 0))
            .Take(8).ToList();

        var printingQueue = await orders.CountByStatusesAsync(["accepted", "printing_scheduled", "printing_started"]);
        var lowStock = await inventory.FindLowStockAsync();
        var customersCount = await users.CountCustomersAsync();
        var aov = allOrders.Count > 0 ? Math.Round(allOrders.Sum(o => o.Total) / allOrders.Count, 2) : 0;

        var revenueSeries = revenueByDay.OrderBy(kv => kv.Key).TakeLast(14)
            .Select(kv => new Dictionary<string, object?> { ["date"] = kv.Key, ["revenue"] = Math.Round(kv.Value, 2) })
            .ToList();

        return new Dictionary<string, object?>
        {
            ["today_revenue"] = Math.Round(todayOrders.Sum(o => o.Total), 2),
            ["today_orders"] = todayOrders.Count,
            ["pending_orders"] = pending.Count,
            ["printing_queue"] = printingQueue,
            ["total_revenue"] = Math.Round(allOrders.Sum(o => o.Total), 2),
            ["total_orders"] = allOrders.Count,
            ["customers_count"] = customersCount,
            ["aov"] = aov,
            ["revenue_series"] = revenueSeries,
            ["top_products"] = topProducts,
            ["low_stock"] = lowStock.Select(BsonMapper.ToDict).ToList(),
            ["recent_orders"] = allOrders.Take(8).Select(BsonMapper.ToDict).ToList()
        };
    }
}

public class MediaService(IMediaRepository media, IActivityLogService activity) : IMediaService
{
    public async Task<List<Dictionary<string, object?>>> ListAsync(int limit)
    {
        var items = await media.ListWithoutDataAsync(limit);
        return items.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<(byte[] Data, string ContentType)> GetBinaryAsync(string mid)
    {
        var m = await media.FindByIdAsync(mid) ?? throw new KeyNotFoundException("Not found");
        return (Convert.FromBase64String(m.Data), m.ContentType);
    }

    public async Task<MediaUploadResponse> UploadAsync(User user, Stream fileStream, string filename, string contentType)
    {
        if (!BackendConstants.AllowedMediaTypes.Contains(contentType))
            throw new InvalidOperationException($"Unsupported type: {contentType}");

        using var ms = new MemoryStream();
        await fileStream.CopyToAsync(ms);
        var data = ms.ToArray();
        if (data.Length > BackendConstants.MaxMediaBytes)
            throw new InvalidOperationException($"File too large (max {BackendConstants.MaxMediaBytes / 1024 / 1024} MB)");

        var mid = IdHelper.NewId();
        await media.InsertAsync(new MediaItem
        {
            Id = mid,
            Filename = filename,
            ContentType = contentType,
            Size = data.Length,
            Data = Convert.ToBase64String(data),
            CreatedAt = IdHelper.NowIso(),
            UploadedBy = user.Email
        });

        await activity.LogAsync(user, "media.upload", mid, new Dictionary<string, object?>
        {
            ["filename"] = filename, ["size"] = data.Length
        });

        return new MediaUploadResponse
        {
            Id = mid,
            Url = $"/api/admin/media/{mid}",
            Filename = filename,
            Size = data.Length,
            ContentType = contentType
        };
    }

    public async Task DeleteAsync(User user, string mid)
    {
        await media.DeleteAsync(mid);
        await activity.LogAsync(user, "media.delete", mid);
    }
}

public class RbacService(
    IRbacRepository rbac,
    IUserRepository users,
    IPermissionService permissions) : IRbacService
{
    public async Task<object> MyPermissionsAsync(string userId) =>
        await permissions.GetPermissionsForResponseAsync(userId);

    public async Task<object> GetUserPermissionsAsync(string uuid)
    {
        var target = await users.FindByIdAsync(uuid) ?? throw new KeyNotFoundException("User not found");
        var perms = await permissions.GetPermissionsForResponseAsync(uuid);
        var overrides = await rbac.GetUserOverridesAsync(uuid);
        Dictionary<string, int> rolePerms = [];
        if (!string.IsNullOrEmpty(target.RoleId))
            rolePerms = await permissions.GetRolePermissionsAsync(target.RoleId);
        return new { user = UserMapper.ToDto(target), permissions = perms, overrides, role_permissions = rolePerms };
    }

    public async Task<object> ListUsersAsync()
    {
        var all = await users.FindAllForAdminAsync();
        return all.Select(UserMapper.ToDto).ToList();
    }

    public async Task<object> UpdateUserPermissionsAsync(string uuid, RolePermissionsRequest request)
    {
        if (await users.FindByIdAsync(uuid) is null) throw new KeyNotFoundException("User not found");
        await permissions.UpdateUserPermissionsAsync(uuid, request.Permissions);
        return await permissions.GetPermissionsForResponseAsync(uuid);
    }

    public async Task<object> ListModulesAsync()
    {
        var mods = await rbac.ListModulesAsync();
        return mods.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<object> ListRolesAsync()
    {
        var roles = await rbac.ListRolesAsync();
        var result = new List<Dictionary<string, object?>>();
        foreach (var role in roles)
        {
            var dict = BsonMapper.ToDict(role);
            dict["permissions"] = await permissions.GetRolePermissionsAsync(role.Id);
            result.Add(dict);
        }
        return result;
    }

    public async Task<object> CreateRoleAsync(RoleRequest request)
    {
        var doc = new Role
        {
            Id = IdHelper.NewId(),
            Name = request.Name,
            Slug = request.Name.ToLowerInvariant().Replace(' ', '-'),
            Description = request.Description,
            TenantId = BackendConstants.DefaultTenantId,
            Metadata = request.Metadata,
            CreatedAt = IdHelper.NowIso()
        };
        await rbac.InsertRoleAsync(doc);
        return BsonMapper.ToDict(doc);
    }

    public async Task<object> GetRoleAsync(string roleId)
    {
        var role = await rbac.FindRoleByIdAsync(roleId) ?? throw new KeyNotFoundException("Role not found");
        var dict = BsonMapper.ToDict(role);
        dict["permissions"] = await permissions.GetRolePermissionsAsync(roleId);
        return dict;
    }

    public async Task<object> UpdateRoleAsync(string roleId, Dictionary<string, object?> payload)
    {
        var allowed = new HashSet<string> { "name", "description", "metadata" };
        var updates = payload.Where(kv => allowed.Contains(kv.Key)).ToDictionary(kv => kv.Key, kv => kv.Value);
        if (updates.Count > 0) await rbac.UpdateRoleAsync(roleId, updates);
        var role = await rbac.FindRoleByIdAsync(roleId) ?? throw new KeyNotFoundException("Role not found");
        return BsonMapper.ToDict(role);
    }

    public async Task<object> DeleteRoleAsync(string roleId)
    {
        if (await rbac.CountUsersWithRoleAsync(roleId) > 0)
            throw new InvalidOperationException("Role is assigned to users");
        await rbac.DeleteRolePermissionsAsync(roleId);
        await rbac.DeleteRoleAsync(roleId);
        return new { ok = true };
    }

    public async Task<object> UpdateRolePermissionsAsync(string roleId, RolePermissionsRequest request)
    {
        if (await rbac.FindRoleByIdAsync(roleId) is null) throw new KeyNotFoundException("Role not found");
        await permissions.UpdateRolePermissionsAsync(roleId, request.Permissions);
        return await permissions.GetRolePermissionsAsync(roleId);
    }
}

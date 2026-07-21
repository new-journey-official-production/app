using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using PrintForge.Constants;
using PrintForge.Infrastructure.Auth;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

public class AuthUserProvider(IUserRepository users, IPermissionService permissions) : IAuthUserProvider
{
    public async Task<User?> GetUserByIdAsync(string userId) => await users.FindByIdAsync(userId);

    public async Task<Dictionary<string, int>> GetPermissionsAsync(string userId) =>
        await permissions.LoadEffectivePermissionsAsync(userId);
}

public class EmailService(IEmailLogRepository emailLog, ILogger<EmailService> logger) : IEmailService
{
    private static readonly Dictionary<string, string> Templates = new()
    {
        ["welcome"] = "Welcome to New Journey, {name}! Your account is ready.",
        ["verify_email"] = "Verify your email: {link}",
        ["reset_password"] = "Reset your password: {link}",
        ["order_confirmation"] = "Order #{order_no} confirmed. Total ₹{total}.",
        ["order_status"] = "Your order #{order_no} is now {status}.",
        ["invoice"] = "Invoice for order #{order_no} attached.",
        ["support_reply"] = "Support update on ticket #{ticket_id}: {message}",
        ["newsletter"] = "Thanks for subscribing to New Journey!"
    };

    public async Task SendAsync(string to, string template, Dictionary<string, object?> ctx)
    {
        var body = Templates.GetValueOrDefault(template, "New Journey notification");
        try
        {
            body = string.Format(body, ctx.Select(kv => (object?)kv.Value ?? "").ToArray());
        }
        catch { /* template may not match */ }

        logger.LogInformation("[EMAIL:mock] to={To} template={Template} body={Body}", to, template, body);
        await emailLog.InsertAsync(new EmailLog
        {
            Id = IdHelper.NewId(),
            To = to,
            Template = template,
            Body = body,
            Context = ctx,
            CreatedAt = IdHelper.NowIso()
        });
    }
}

public class ActivityLogService(IActivityLogRepository logs) : IActivityLogService
{
    public async Task LogAsync(User? user, string action, string target, Dictionary<string, object?>? meta = null)
    {
        if (user is null) return;
        await logs.InsertAsync(new ActivityLog
        {
            Id = IdHelper.NewId(),
            UserId = user.Id,
            UserEmail = user.Email,
            UserName = user.Name,
            Action = action,
            Target = target,
            Meta = meta ?? [],
            CreatedAt = IdHelper.NowIso()
        });
    }
}

public class PermissionService(
    IRbacRepository rbac,
    IUserRepository users,
    ILogger<PermissionService> logger) : IPermissionService
{
    private static readonly ConcurrentDictionary<string, Dictionary<string, int>> PermCache = new();

    public async Task SeedRbacAsync()
    {
        foreach (var mod in Modules.AllModules)
        {
            await rbac.UpsertModuleAsync(new ModuleEntity
            {
                ModuleId = mod.ModuleId,
                Name = mod.Name,
                Description = mod.Description,
                Metadata = new Dictionary<string, object?> { ["group"] = mod.Group }
            });
        }

        var rolesSeed = new[]
        {
            new { Name = "Administrator", Slug = "admin", Description = "Full system access" },
            new { Name = "Staff", Slug = "staff", Description = "Operational access (read/update)" },
            new { Name = "Customer", Slug = "customer", Description = "Customer account access" }
        };

        var roleIds = new Dictionary<string, string>();
        foreach (var r in rolesSeed)
        {
            var existing = await rbac.FindRoleBySlugAsync(r.Slug);
            if (existing is not null)
                roleIds[r.Slug] = existing.Id;
            else
            {
                var rid = IdHelper.NewId();
                await rbac.InsertRoleAsync(new Role
                {
                    Id = rid,
                    Name = r.Name,
                    Slug = r.Slug,
                    Description = r.Description,
                    TenantId = BackendConstants.DefaultTenantId,
                    CreatedAt = IdHelper.NowIso()
                });
                roleIds[r.Slug] = rid;
            }
        }

        foreach (var modId in Modules.AdminModules)
            await rbac.UpsertRolePermissionAsync(roleIds["admin"], modId, PermissionHelper.FullCrud);

        var staffBits = new Dictionary<string, int>
        {
            [Modules.Storefront] = (int)CPPermissions.Read,
            [Modules.Catalog] = (int)CPPermissions.Read,
            [Modules.Dashboard] = PermissionHelper.FullCrud,
            [Modules.Products] = (int)(CPPermissions.Read | CPPermissions.Update | CPPermissions.Create),
            [Modules.Orders] = (int)(CPPermissions.Read | CPPermissions.Update),
            [Modules.Inventory] = (int)(CPPermissions.Read | CPPermissions.Update),
            [Modules.Printers] = (int)(CPPermissions.Read | CPPermissions.Update),
            [Modules.Customers] = (int)CPPermissions.Read,
            [Modules.Support] = PermissionHelper.FullCrud,
            [Modules.Reviews] = (int)(CPPermissions.Read | CPPermissions.Update),
            [Modules.Blog] = (int)(CPPermissions.Read | CPPermissions.Update | CPPermissions.Create),
            [Modules.Coupons] = (int)CPPermissions.Read,
            [Modules.Analytics] = (int)CPPermissions.Read,
            [Modules.Media] = (int)(CPPermissions.Read | CPPermissions.Create),
            [Modules.ActivityLogs] = (int)CPPermissions.Read,
            [Modules.Settings] = (int)CPPermissions.Read,
            [Modules.Roles] = (int)CPPermissions.Read,
            [Modules.Users] = (int)CPPermissions.Read,
            [Modules.B2bDashboard] = (int)CPPermissions.Read,
            [Modules.B2bCategories] = (int)(CPPermissions.Read | CPPermissions.Update | CPPermissions.Create),
            [Modules.B2bProducts] = (int)(CPPermissions.Read | CPPermissions.Update | CPPermissions.Create),
            [Modules.B2bCatalog] = (int)(CPPermissions.Read | CPPermissions.Create),
            [Modules.B2bQuotes] = (int)(CPPermissions.Read | CPPermissions.Update),
            [Modules.B2bDealers] = (int)(CPPermissions.Read | CPPermissions.Update),
            [Modules.B2bAnalytics] = (int)CPPermissions.Read,
            [Modules.B2bSettings] = (int)CPPermissions.Read,
            [Modules.B2bPortal] = (int)CPPermissions.Read,
            [Modules.Accounts] = PermissionHelper.FullCrud
        };
        foreach (var (modId, bits) in staffBits)
            await rbac.UpsertRolePermissionAsync(roleIds["staff"], modId, bits);

        var customerBits = new Dictionary<string, int>
        {
            [Modules.Storefront] = (int)CPPermissions.Read,
            [Modules.Catalog] = (int)CPPermissions.Read,
            [Modules.Account] = (int)CPPermissions.Read,
            [Modules.AccountOrders] = (int)(CPPermissions.Read | CPPermissions.Create),
            [Modules.AccountWishlist] = PermissionHelper.FullCrud,
            [Modules.AccountProfile] = PermissionHelper.FullCrud,
            [Modules.AccountSupport] = (int)(CPPermissions.Read | CPPermissions.Create | CPPermissions.Update),
            [Modules.Checkout] = (int)(CPPermissions.Read | CPPermissions.Create),
            [Modules.B2bPortal] = (int)(CPPermissions.Read | CPPermissions.Create)
        };
        foreach (var (modId, bits) in customerBits)
            await rbac.UpsertRolePermissionAsync(roleIds["customer"], modId, bits);

        foreach (var (slug, rid) in roleIds)
            await users.UpdateManyByRoleAsync(slug, rid);

        logger.LogInformation("RBAC seed complete");
    }

    public async Task<Dictionary<string, PermissionResponseEntry>> GetPermissionsForResponseAsync(string userId)
    {
        var perms = await LoadEffectivePermissionsAsync(userId);
        return perms.ToDictionary(
            kv => kv.Key,
            kv => new PermissionResponseEntry { Permission = kv.Value, ModuleId = kv.Key });
    }

    public async Task<Dictionary<string, int>> LoadEffectivePermissionsAsync(string userId)
    {
        if (PermCache.TryGetValue(userId, out var cached)) return cached;

        var user = await users.FindByIdAsync(userId);
        if (user is null) return [];

        var merged = new Dictionary<string, int>();
        if (!string.IsNullOrEmpty(user.RoleId))
            merged = await rbac.GetRolePermissionsAsync(user.RoleId);
        else if (user.Role == "admin")
            merged = Modules.AdminModules.ToDictionary(m => m, _ => PermissionHelper.FullCrud);
        else
        {
            var slug = user.Role == "staff" ? "staff" : "customer";
            var role = await rbac.FindRoleBySlugAsync(slug);
            if (role is not null)
                merged = await rbac.GetRolePermissionsAsync(role.Id);
        }

        foreach (var (modId, bits) in await rbac.GetUserOverridesAsync(userId))
            merged[modId] = bits;

        PermCache[userId] = merged;
        return merged;
    }

    public async Task<bool> CheckPermissionAsync(string userId, string moduleId, int requiredBits)
    {
        var perms = await LoadEffectivePermissionsAsync(userId);
        return PermissionHelper.HasPermission(perms.GetValueOrDefault(moduleId, 0), requiredBits);
    }

    public async Task UpdateRolePermissionsAsync(string roleId, List<PermissionEntry> matrix)
    {
        foreach (var entry in matrix)
            await rbac.UpsertRolePermissionAsync(roleId, entry.ModuleId, entry.PermissionBits);

        var usersWithRole = await rbac.FindUsersByRoleIdAsync(roleId);
        foreach (var u in usersWithRole) InvalidateCache(u.Id);
    }

    public async Task UpdateUserPermissionsAsync(string userId, List<PermissionEntry> matrix)
    {
        var perms = matrix.Select(e => new UserPermission
        {
            Id = IdHelper.NewId(),
            UserId = userId,
            ModuleId = e.ModuleId,
            PermissionBits = e.PermissionBits
        });
        await rbac.ReplaceUserPermissionsAsync(userId, perms);
        InvalidateCache(userId);
    }

    public Task<Dictionary<string, int>> GetRolePermissionsAsync(string roleId) =>
        rbac.GetRolePermissionsAsync(roleId);

    public void InvalidateCache(string? userId = null)
    {
        if (userId is not null) PermCache.TryRemove(userId, out _);
        else PermCache.Clear();
    }
}

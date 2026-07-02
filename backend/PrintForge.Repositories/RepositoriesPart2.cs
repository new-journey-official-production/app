using MongoDB.Driver;
using PrintForge.Infrastructure.Database;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;

namespace PrintForge.Repositories;

public class OrderRepository(MongoDbContext db) : IOrderRepository
{
    public async Task InsertAsync(Order order) => await db.Orders.InsertOneAsync(order);

    public async Task<Order?> FindByIdAsync(string id) =>
        await db.Orders.Find(Builders<Order>.Filter.Eq(o => o.Id, id)).FirstOrDefaultAsync();

    public async Task<Order?> FindByIdForUserAsync(string id, string userId) =>
        await db.Orders.Find(
            Builders<Order>.Filter.Eq(o => o.Id, id) &
            Builders<Order>.Filter.Eq(o => o.UserId, userId)).FirstOrDefaultAsync();

    public async Task<List<Order>> FindByUserAsync(string userId) =>
        await db.Orders.Find(Builders<Order>.Filter.Eq(o => o.UserId, userId))
            .SortByDescending(o => o.CreatedAt).Limit(200).ToListAsync();

    public async Task<List<Order>> AdminListAsync(string? status, string? query, int limit)
    {
        var filter = Builders<Order>.Filter.Empty;
        if (!string.IsNullOrEmpty(status)) filter &= Builders<Order>.Filter.Eq(o => o.Status, status);
        if (!string.IsNullOrEmpty(query))
        {
            var regex = new MongoDB.Bson.BsonRegularExpression(query, "i");
            filter &= Builders<Order>.Filter.Or(
                Builders<Order>.Filter.Regex(o => o.OrderNo, regex),
                Builders<Order>.Filter.Regex(o => o.UserEmail, regex));
        }
        return await db.Orders.Find(filter).SortByDescending(o => o.CreatedAt).Limit(limit).ToListAsync();
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        var filter = Builders<Order>.Filter.Eq(o => o.Id, id);
        var update = Builders<Order>.Update.Combine(
            updates.Select(kv => Builders<Order>.Update.Set(kv.Key, kv.Value)));
        await db.Orders.UpdateOneAsync(filter, update);
    }

    public async Task PushTimelineAsync(string id, OrderTimelineEntry entry, string status) =>
        await db.Orders.UpdateOneAsync(
            Builders<Order>.Filter.Eq(o => o.Id, id),
            Builders<Order>.Update
                .Set(o => o.Status, status)
                .Set(o => o.UpdatedAt, entry.At)
                .Push(o => o.Timeline, entry));

    public async Task<List<Order>> ListAllAsync(int limit = 5000) =>
        await db.Orders.Find(FilterDefinition<Order>.Empty).Limit(limit).ToListAsync();

    public async Task<long> CountByStatusesAsync(IEnumerable<string> statuses) =>
        await db.Orders.CountDocumentsAsync(Builders<Order>.Filter.In(o => o.Status, statuses));
}

public class InventoryRepository(MongoDbContext db) : IInventoryRepository
{
    public async Task<List<InventoryItem>> ListAsync() =>
        await db.Inventory.Find(FilterDefinition<InventoryItem>.Empty).SortBy(i => i.Name).Limit(500).ToListAsync();

    public async Task InsertAsync(InventoryItem item) => await db.Inventory.InsertOneAsync(item);

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        var filter = Builders<InventoryItem>.Filter.Eq(i => i.Id, id);
        var update = Builders<InventoryItem>.Update.Combine(
            updates.Select(kv => Builders<InventoryItem>.Update.Set(kv.Key, kv.Value)));
        await db.Inventory.UpdateOneAsync(filter, update);
    }

    public async Task DeleteAsync(string id) =>
        await db.Inventory.DeleteOneAsync(Builders<InventoryItem>.Filter.Eq(i => i.Id, id));

    public async Task<List<InventoryItem>> FindLowStockAsync()
    {
        // quantity <= reorder_level
        var all = await db.Inventory.Find(FilterDefinition<InventoryItem>.Empty).Limit(500).ToListAsync();
        return all.Where(i => i.Quantity <= i.ReorderLevel).Take(50).ToList();
    }

    public async Task<long> CountAsync() =>
        await db.Inventory.CountDocumentsAsync(FilterDefinition<InventoryItem>.Empty);

    public async Task InsertManyAsync(IEnumerable<InventoryItem> items) =>
        await db.Inventory.InsertManyAsync(items);
}

public class PrinterRepository(MongoDbContext db) : IPrinterRepository
{
    public async Task<List<Printer>> ListAsync() =>
        await db.Printers.Find(FilterDefinition<Printer>.Empty).SortBy(p => p.Name).Limit(100).ToListAsync();

    public async Task InsertAsync(Printer printer) => await db.Printers.InsertOneAsync(printer);

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        var filter = Builders<Printer>.Filter.Eq(p => p.Id, id);
        var update = Builders<Printer>.Update.Combine(
            updates.Select(kv => Builders<Printer>.Update.Set(kv.Key, kv.Value)));
        await db.Printers.UpdateOneAsync(filter, update);
    }

    public async Task DeleteAsync(string id) =>
        await db.Printers.DeleteOneAsync(Builders<Printer>.Filter.Eq(p => p.Id, id));

    public async Task<long> CountAsync() =>
        await db.Printers.CountDocumentsAsync(FilterDefinition<Printer>.Empty);

    public async Task InsertManyAsync(IEnumerable<Printer> printers) =>
        await db.Printers.InsertManyAsync(printers);
}

public class TicketRepository(MongoDbContext db) : ITicketRepository
{
    public async Task<List<Ticket>> FindByUserAsync(string userId) =>
        await db.Tickets.Find(Builders<Ticket>.Filter.Eq(t => t.UserId, userId))
            .SortByDescending(t => t.CreatedAt).Limit(200).ToListAsync();

    public async Task<Ticket?> FindByIdAsync(string id) =>
        await db.Tickets.Find(Builders<Ticket>.Filter.Eq(t => t.Id, id)).FirstOrDefaultAsync();

    public async Task InsertAsync(Ticket ticket) => await db.Tickets.InsertOneAsync(ticket);

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        var filter = Builders<Ticket>.Filter.Eq(t => t.Id, id);
        var update = Builders<Ticket>.Update.Combine(
            updates.Select(kv => Builders<Ticket>.Update.Set(kv.Key, kv.Value)));
        await db.Tickets.UpdateOneAsync(filter, update);
    }

    public async Task PushMessageAsync(string id, TicketMessage message, string status) =>
        await db.Tickets.UpdateOneAsync(
            Builders<Ticket>.Filter.Eq(t => t.Id, id),
            Builders<Ticket>.Update
                .Push(t => t.Messages, message)
                .Set(t => t.UpdatedAt, message.At)
                .Set(t => t.Status, status));

    public async Task<List<Ticket>> ListAllAsync(int limit = 200) =>
        await db.Tickets.Find(FilterDefinition<Ticket>.Empty).SortByDescending(t => t.UpdatedAt).Limit(limit).ToListAsync();
}

public class NotificationRepository(MongoDbContext db) : INotificationRepository
{
    public async Task<List<Notification>> FindByUserAsync(string userId, int limit = 100) =>
        await db.Notifications.Find(Builders<Notification>.Filter.Eq(n => n.UserId, userId))
            .SortByDescending(n => n.CreatedAt).Limit(limit).ToListAsync();

    public async Task InsertAsync(Notification notification) =>
        await db.Notifications.InsertOneAsync(notification);

    public async Task MarkReadAsync(string id, string userId) =>
        await db.Notifications.UpdateOneAsync(
            Builders<Notification>.Filter.Eq(n => n.Id, id) & Builders<Notification>.Filter.Eq(n => n.UserId, userId),
            Builders<Notification>.Update.Set(n => n.Read, true));
}

public class BlogRepository(MongoDbContext db) : IBlogRepository
{
    public async Task<List<BlogPost>> ListPublishedAsync(int limit) =>
        await db.Blog.Find(Builders<BlogPost>.Filter.Eq(b => b.IsPublished, true))
            .SortByDescending(b => b.CreatedAt).Limit(limit).ToListAsync();

    public async Task<BlogPost?> FindBySlugAsync(string slug) =>
        await db.Blog.Find(Builders<BlogPost>.Filter.Eq(b => b.Slug, slug)).FirstOrDefaultAsync();

    public async Task InsertAsync(BlogPost post) => await db.Blog.InsertOneAsync(post);

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        var filter = Builders<BlogPost>.Filter.Eq(b => b.Id, id);
        var update = Builders<BlogPost>.Update.Combine(
            updates.Select(kv => Builders<BlogPost>.Update.Set(kv.Key, kv.Value)));
        await db.Blog.UpdateOneAsync(filter, update);
    }

    public async Task DeleteAsync(string id) =>
        await db.Blog.DeleteOneAsync(Builders<BlogPost>.Filter.Eq(b => b.Id, id));

    public async Task<long> CountAsync() =>
        await db.Blog.CountDocumentsAsync(FilterDefinition<BlogPost>.Empty);

    public async Task InsertManyAsync(IEnumerable<BlogPost> posts) =>
        await db.Blog.InsertManyAsync(posts);
}

public class MediaRepository(MongoDbContext db) : IMediaRepository
{
    public async Task<List<MediaItem>> ListWithoutDataAsync(int limit) =>
        await db.Media.Find(FilterDefinition<MediaItem>.Empty)
            .SortByDescending(m => m.CreatedAt).Limit(limit)
            .Project(m => new MediaItem
            {
                Id = m.Id, Filename = m.Filename, ContentType = m.ContentType,
                Size = m.Size, CreatedAt = m.CreatedAt, UploadedBy = m.UploadedBy
            }).ToListAsync();

    public async Task<MediaItem?> FindByIdAsync(string id) =>
        await db.Media.Find(Builders<MediaItem>.Filter.Eq(m => m.Id, id)).FirstOrDefaultAsync();

    public async Task InsertAsync(MediaItem item) => await db.Media.InsertOneAsync(item);

    public async Task DeleteAsync(string id) =>
        await db.Media.DeleteOneAsync(Builders<MediaItem>.Filter.Eq(m => m.Id, id));
}

public class ActivityLogRepository(MongoDbContext db) : IActivityLogRepository
{
    public async Task InsertAsync(ActivityLog log) => await db.ActivityLogs.InsertOneAsync(log);

    public async Task<List<ActivityLog>> ListAsync(int limit, string? action)
    {
        var filter = FilterDefinition<ActivityLog>.Empty;
        if (!string.IsNullOrEmpty(action))
            filter = Builders<ActivityLog>.Filter.Eq(a => a.Action, action);
        return await db.ActivityLogs.Find(filter).SortByDescending(a => a.CreatedAt).Limit(limit).ToListAsync();
    }
}

public class PaymentRepository(MongoDbContext db) : IPaymentRepository
{
    public async Task InsertAsync(Payment payment) => await db.Payments.InsertOneAsync(payment);
}

public class PasswordResetRepository(MongoDbContext db) : IPasswordResetRepository
{
    public async Task<PasswordReset?> FindValidTokenAsync(string token) =>
        await db.PasswordResets.Find(
            Builders<PasswordReset>.Filter.Eq(p => p.Token, token) &
            Builders<PasswordReset>.Filter.Eq(p => p.Used, false)).FirstOrDefaultAsync();

    public async Task InsertAsync(PasswordReset reset) => await db.PasswordResets.InsertOneAsync(reset);

    public async Task MarkUsedAsync(string id) =>
        await db.PasswordResets.UpdateOneAsync(
            Builders<PasswordReset>.Filter.Eq(p => p.Id, id),
            Builders<PasswordReset>.Update.Set(p => p.Used, true));
}

public class EmailLogRepository(MongoDbContext db) : IEmailLogRepository
{
    public async Task InsertAsync(EmailLog log) => await db.EmailLog.InsertOneAsync(log);
}

public class NewsletterRepository(MongoDbContext db) : INewsletterRepository
{
    public async Task UpsertAsync(string email, string id, string createdAt) =>
        await db.Newsletter.UpdateOneAsync(
            Builders<NewsletterSubscriber>.Filter.Eq(n => n.Email, email),
            Builders<NewsletterSubscriber>.Update
                .SetOnInsert(n => n.Id, id)
                .SetOnInsert(n => n.Email, email)
                .SetOnInsert(n => n.CreatedAt, createdAt),
            new UpdateOptions { IsUpsert = true });
}

public class ContactRepository(MongoDbContext db) : IContactRepository
{
    public async Task InsertAsync(ContactMessage message) => await db.ContactMessages.InsertOneAsync(message);
}

public class RbacRepository(MongoDbContext db) : IRbacRepository
{
    public async Task UpsertModuleAsync(ModuleEntity module) =>
        await db.Modules.UpdateOneAsync(
            Builders<ModuleEntity>.Filter.Eq(m => m.ModuleId, module.ModuleId),
            Builders<ModuleEntity>.Update.Set(m => m.ModuleId, module.ModuleId)
                .Set(m => m.Name, module.Name)
                .Set(m => m.Description, module.Description)
                .Set(m => m.Metadata, module.Metadata),
            new UpdateOptions { IsUpsert = true });

    public async Task<List<ModuleEntity>> ListModulesAsync() =>
        await db.Modules.Find(FilterDefinition<ModuleEntity>.Empty).SortBy(m => m.ModuleId).Limit(200).ToListAsync();

    public async Task<Role?> FindRoleBySlugAsync(string slug) =>
        await db.Roles.Find(Builders<Role>.Filter.Eq(r => r.Slug, slug)).FirstOrDefaultAsync();

    public async Task<Role?> FindRoleByIdAsync(string id) =>
        await db.Roles.Find(Builders<Role>.Filter.Eq(r => r.Id, id)).FirstOrDefaultAsync();

    public async Task InsertRoleAsync(Role role) => await db.Roles.InsertOneAsync(role);

    public async Task<List<Role>> ListRolesAsync() =>
        await db.Roles.Find(FilterDefinition<Role>.Empty).SortBy(r => r.Name).Limit(100).ToListAsync();

    public async Task UpdateRoleAsync(string id, Dictionary<string, object?> updates)
    {
        var filter = Builders<Role>.Filter.Eq(r => r.Id, id);
        var update = Builders<Role>.Update.Combine(
            updates.Select(kv => Builders<Role>.Update.Set(kv.Key, kv.Value)));
        await db.Roles.UpdateOneAsync(filter, update);
    }

    public async Task DeleteRoleAsync(string id) =>
        await db.Roles.DeleteOneAsync(Builders<Role>.Filter.Eq(r => r.Id, id));

    public async Task<long> CountUsersWithRoleAsync(string roleId) =>
        await db.Users.CountDocumentsAsync(Builders<User>.Filter.Eq(u => u.RoleId, roleId));

    public async Task UpsertRolePermissionAsync(string roleId, string moduleId, int bits) =>
        await db.RolePermissions.UpdateOneAsync(
            Builders<RolePermission>.Filter.Eq(rp => rp.RoleId, roleId) &
            Builders<RolePermission>.Filter.Eq(rp => rp.ModuleId, moduleId),
            Builders<RolePermission>.Update
                .Set(rp => rp.RoleId, roleId)
                .Set(rp => rp.ModuleId, moduleId)
                .Set(rp => rp.PermissionBits, bits),
            new UpdateOptions { IsUpsert = true });

    public async Task DeleteRolePermissionsAsync(string roleId) =>
        await db.RolePermissions.DeleteManyAsync(Builders<RolePermission>.Filter.Eq(rp => rp.RoleId, roleId));

    public async Task<Dictionary<string, int>> GetRolePermissionsAsync(string roleId)
    {
        var perms = await db.RolePermissions.Find(Builders<RolePermission>.Filter.Eq(rp => rp.RoleId, roleId)).ToListAsync();
        return perms.ToDictionary(p => p.ModuleId, p => p.PermissionBits);
    }

    public async Task<Dictionary<string, int>> GetUserOverridesAsync(string userId)
    {
        var perms = await db.UserPermissions.Find(Builders<UserPermission>.Filter.Eq(up => up.UserId, userId)).ToListAsync();
        return perms.ToDictionary(p => p.ModuleId, p => p.PermissionBits);
    }

    public async Task ReplaceUserPermissionsAsync(string userId, IEnumerable<UserPermission> permissions)
    {
        await db.UserPermissions.DeleteManyAsync(Builders<UserPermission>.Filter.Eq(up => up.UserId, userId));
        var list = permissions.Where(p => p.PermissionBits > 0).ToList();
        if (list.Count > 0) await db.UserPermissions.InsertManyAsync(list);
    }

    public async Task<List<User>> FindUsersByRoleIdAsync(string roleId) =>
        await db.Users.Find(Builders<User>.Filter.Eq(u => u.RoleId, roleId)).ToListAsync();
}

using Dapper;
using PrintForge.Infrastructure.Database;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;

namespace PrintForge.Repositories;

/// <summary>Postgres-backed order repository.</summary>
public class OrderRepository(PostgresDb db) : IOrderRepository
{
    public async Task InsertAsync(Order order)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into orders (
                id, order_no, user_id, user_email, items, address, payment_method, coupon_code,
                subtotal, shipping, gst, discount, total, status, timeline, notes, priority,
                printer_id, created_at, updated_at
            )
            values (
                @Id, @OrderNo, @UserId, @UserEmail, @Items::jsonb, @Address::jsonb, @PaymentMethod, @CouponCode,
                @Subtotal, @Shipping, @Gst, @Discount, @Total, @Status, @Timeline::jsonb, @Notes, @Priority,
                @PrinterId, coalesce(nullif(@CreatedAt, '')::timestamptz, now()), coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, order);
    }

    public async Task<Order?> FindByIdAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, order_no, user_id, user_email, items, address, payment_method, coupon_code,
                subtotal, shipping, gst, discount, total, status, timeline, notes, priority,
                printer_id, created_at::text as created_at, updated_at::text as updated_at
            from orders
            where id = @Id;
            """;
        return await conn.QuerySingleOrDefaultAsync<Order>(sql, new { Id = id });
    }

    public async Task<Order?> FindByIdForUserAsync(string id, string userId)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, order_no, user_id, user_email, items, address, payment_method, coupon_code,
                subtotal, shipping, gst, discount, total, status, timeline, notes, priority,
                printer_id, created_at::text as created_at, updated_at::text as updated_at
            from orders
            where id = @Id and user_id = @UserId;
            """;
        return await conn.QuerySingleOrDefaultAsync<Order>(sql, new { Id = id, UserId = userId });
    }

    public async Task<List<Order>> FindByUserAsync(string userId)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, order_no, user_id, user_email, items, address, payment_method, coupon_code,
                subtotal, shipping, gst, discount, total, status, timeline, notes, priority,
                printer_id, created_at::text as created_at, updated_at::text as updated_at
            from orders
            where user_id = @UserId
            order by created_at desc
            limit 200;
            """;
        return (await conn.QueryAsync<Order>(sql, new { UserId = userId })).ToList();
    }

    public async Task<List<Order>> AdminListAsync(string? status, string? query, int limit)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, order_no, user_id, user_email, items, address, payment_method, coupon_code,
                subtotal, shipping, gst, discount, total, status, timeline, notes, priority,
                printer_id, created_at::text as created_at, updated_at::text as updated_at
            from orders
            where (@Status is null or status = @Status)
              and (
                    @Query is null
                    or order_no ilike ('%' || @Query || '%')
                    or user_email ilike ('%' || @Query || '%')
                  )
            order by created_at desc
            limit @Limit;
            """;
        return (await conn.QueryAsync<Order>(sql, new { Status = status, Query = query, Limit = limit })).ToList();
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        await using var conn = await db.OpenConnectionAsync();
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, setParameters) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update orders set {setClause} where id = @id;";
        await conn.ExecuteAsync(sql, setParameters);
    }

    public async Task PushTimelineAsync(string id, OrderTimelineEntry entry, string status)
    {
        await using var conn = await db.OpenConnectionAsync();
        await using var tx = await conn.BeginTransactionAsync();

        // Read existing jsonb array, append in-memory, then write back with status/update timestamp.
        const string readSql = "select timeline from orders where id = @Id;";
        var timeline = await conn.QuerySingleOrDefaultAsync<List<OrderTimelineEntry>>(readSql, new { Id = id }, tx) ?? [];
        timeline.Add(entry);

        const string writeSql = """
            update orders
            set timeline = @Timeline::jsonb,
                status = @Status,
                updated_at = coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            where id = @Id;
            """;
        await conn.ExecuteAsync(writeSql, new
        {
            Id = id,
            Timeline = timeline,
            Status = status,
            UpdatedAt = entry.At,
        }, tx);

        await tx.CommitAsync();
    }

    public async Task<List<Order>> ListAllAsync(int limit = 5000)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, order_no, user_id, user_email, items, address, payment_method, coupon_code,
                subtotal, shipping, gst, discount, total, status, timeline, notes, priority,
                printer_id, created_at::text as created_at, updated_at::text as updated_at
            from orders
            order by created_at desc
            limit @Limit;
            """;
        return (await conn.QueryAsync<Order>(sql, new { Limit = limit })).ToList();
    }

    public async Task<long> CountByStatusesAsync(IEnumerable<string> statuses)
    {
        var list = statuses?.ToArray() ?? [];
        if (list.Length == 0) return 0;
        await using var conn = await db.OpenConnectionAsync();
        const string sql = "select count(*) from orders where status = any(@Statuses::text[]);";
        return await conn.ExecuteScalarAsync<long>(sql, new { Statuses = list });
    }

    public async Task DeleteAsync(string id)
    {
        const string sql = "delete from orders where id = @Id;";
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync(sql, new { Id = id });
    }
}

/// <summary>Postgres-backed inventory repository.</summary>
public class InventoryRepository(PostgresDb db) : IInventoryRepository
{
    public async Task<List<InventoryItem>> ListAsync()
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, name, kind, material, color, quantity, unit, reorder_level, unit_cost, supplier,
                created_at::text as created_at, updated_at::text as updated_at
            from inventory
            order by name
            limit 500;
            """;
        return (await conn.QueryAsync<InventoryItem>(sql)).ToList();
    }

    public async Task InsertAsync(InventoryItem item)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into inventory (
                id, name, kind, material, color, quantity, unit, reorder_level, unit_cost, supplier, created_at, updated_at
            )
            values (
                @Id, @Name, @Kind, @Material, @Color, @Quantity, @Unit, @ReorderLevel, @UnitCost, @Supplier,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now()), coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, item);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        await using var conn = await db.OpenConnectionAsync();
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, setParameters) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update inventory set {setClause} where id = @id;";
        await conn.ExecuteAsync(sql, setParameters);
    }

    public async Task DeleteAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("delete from inventory where id = @Id;", new { Id = id });
    }

    public async Task<List<InventoryItem>> FindLowStockAsync()
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, name, kind, material, color, quantity, unit, reorder_level, unit_cost, supplier,
                created_at::text as created_at, updated_at::text as updated_at
            from inventory
            where quantity <= reorder_level
            order by quantity asc
            limit 50;
            """;
        return (await conn.QueryAsync<InventoryItem>(sql)).ToList();
    }

    public async Task<long> CountAsync()
    {
        await using var conn = await db.OpenConnectionAsync();
        return await conn.ExecuteScalarAsync<long>("select count(*) from inventory;");
    }

    public async Task InsertManyAsync(IEnumerable<InventoryItem> items)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into inventory (
                id, name, kind, material, color, quantity, unit, reorder_level, unit_cost, supplier, created_at, updated_at
            )
            values (
                @Id, @Name, @Kind, @Material, @Color, @Quantity, @Unit, @ReorderLevel, @UnitCost, @Supplier,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now()), coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, items);
    }
}

/// <summary>Postgres-backed printer repository.</summary>
public class PrinterRepository(PostgresDb db) : IPrinterRepository
{
    public async Task<List<Printer>> ListAsync()
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, name, model, status, nozzle_size, filament_loaded, current_job, total_hours,
                created_at::text as created_at
            from printers
            order by name
            limit 100;
            """;
        return (await conn.QueryAsync<Printer>(sql)).ToList();
    }

    public async Task InsertAsync(Printer printer)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into printers (
                id, name, model, status, nozzle_size, filament_loaded, current_job, total_hours, created_at
            )
            values (
                @Id, @Name, @Model, @Status, @NozzleSize, @FilamentLoaded, @CurrentJob, @TotalHours,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, printer);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        await using var conn = await db.OpenConnectionAsync();
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, setParameters) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update printers set {setClause} where id = @id;";
        await conn.ExecuteAsync(sql, setParameters);
    }

    public async Task DeleteAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("delete from printers where id = @Id;", new { Id = id });
    }

    public async Task<long> CountAsync()
    {
        await using var conn = await db.OpenConnectionAsync();
        return await conn.ExecuteScalarAsync<long>("select count(*) from printers;");
    }

    public async Task InsertManyAsync(IEnumerable<Printer> printers)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into printers (
                id, name, model, status, nozzle_size, filament_loaded, current_job, total_hours, created_at
            )
            values (
                @Id, @Name, @Model, @Status, @NozzleSize, @FilamentLoaded, @CurrentJob, @TotalHours,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, printers);
    }
}

/// <summary>Postgres-backed support ticket repository.</summary>
public class TicketRepository(PostgresDb db) : ITicketRepository
{
    public async Task<List<Ticket>> FindByUserAsync(string userId)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, user_id, user_name, user_email, subject, order_no, status, messages,
                created_at::text as created_at, updated_at::text as updated_at
            from tickets
            where user_id = @UserId
            order by created_at desc
            limit 200;
            """;
        return (await conn.QueryAsync<Ticket>(sql, new { UserId = userId })).ToList();
    }

    public async Task<Ticket?> FindByIdAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, user_id, user_name, user_email, subject, order_no, status, messages,
                created_at::text as created_at, updated_at::text as updated_at
            from tickets
            where id = @Id;
            """;
        return await conn.QuerySingleOrDefaultAsync<Ticket>(sql, new { Id = id });
    }

    public async Task InsertAsync(Ticket ticket)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into tickets (
                id, user_id, user_name, user_email, subject, order_no, status, messages, created_at, updated_at
            )
            values (
                @Id, @UserId, @UserName, @UserEmail, @Subject, @OrderNo, @Status, @Messages::jsonb,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now()), coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, ticket);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        await using var conn = await db.OpenConnectionAsync();
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, setParameters) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update tickets set {setClause} where id = @id;";
        await conn.ExecuteAsync(sql, setParameters);
    }

    public async Task PushMessageAsync(string id, TicketMessage message, string status)
    {
        await using var conn = await db.OpenConnectionAsync();
        await using var tx = await conn.BeginTransactionAsync();

        // Preserve append semantics by reading and rewriting the jsonb array in one transaction.
        const string readSql = "select messages from tickets where id = @Id;";
        var messages = await conn.QuerySingleOrDefaultAsync<List<TicketMessage>>(readSql, new { Id = id }, tx) ?? [];
        messages.Add(message);

        const string writeSql = """
            update tickets
            set messages = @Messages::jsonb,
                status = @Status,
                updated_at = coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            where id = @Id;
            """;
        await conn.ExecuteAsync(writeSql, new
        {
            Id = id,
            Messages = messages,
            Status = status,
            UpdatedAt = message.At,
        }, tx);

        await tx.CommitAsync();
    }

    public async Task<List<Ticket>> ListAllAsync(int limit = 200)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, user_id, user_name, user_email, subject, order_no, status, messages,
                created_at::text as created_at, updated_at::text as updated_at
            from tickets
            order by updated_at desc
            limit @Limit;
            """;
        return (await conn.QueryAsync<Ticket>(sql, new { Limit = limit })).ToList();
    }
}

/// <summary>Postgres-backed notification repository.</summary>
public class NotificationRepository(PostgresDb db) : INotificationRepository
{
    public async Task<List<Notification>> FindByUserAsync(string userId, int limit = 100)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, user_id, title, message, kind, ref_id, "read",
                created_at::text as created_at
            from notifications
            where user_id = @UserId
            order by created_at desc
            limit @Limit;
            """;
        return (await conn.QueryAsync<Notification>(sql, new { UserId = userId, Limit = limit })).ToList();
    }

    public async Task InsertAsync(Notification notification)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into notifications (
                id, user_id, title, message, kind, ref_id, "read", created_at
            )
            values (
                @Id, @UserId, @Title, @Message, @Kind, @RefId, @Read, coalesce(nullif(@CreatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, notification);
    }

    public async Task MarkReadAsync(string id, string userId)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("""update notifications set "read" = true where id = @Id and user_id = @UserId;""",
            new { Id = id, UserId = userId });
    }
}

/// <summary>Postgres-backed blog post repository.</summary>
public class BlogRepository(PostgresDb db) : IBlogRepository
{
    public async Task<List<BlogPost>> ListPublishedAsync(int limit)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, title, slug, excerpt, content, cover_image, tags, is_published,
                created_at::text as created_at, updated_at::text as updated_at
            from blog_posts
            where is_published = true
            order by created_at desc
            limit @Limit;
            """;
        return (await conn.QueryAsync<BlogPost>(sql, new { Limit = limit })).ToList();
    }

    public async Task<BlogPost?> FindBySlugAsync(string slug)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, title, slug, excerpt, content, cover_image, tags, is_published,
                created_at::text as created_at, updated_at::text as updated_at
            from blog_posts
            where slug = @Slug;
            """;
        return await conn.QuerySingleOrDefaultAsync<BlogPost>(sql, new { Slug = slug });
    }

    public async Task InsertAsync(BlogPost post)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into blog_posts (
                id, title, slug, excerpt, content, cover_image, tags, is_published, created_at, updated_at
            )
            values (
                @Id, @Title, @Slug, @Excerpt, @Content, @CoverImage, @Tags::jsonb, @IsPublished,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now()), coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, post);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        await using var conn = await db.OpenConnectionAsync();
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, setParameters) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update blog_posts set {setClause} where id = @id;";
        await conn.ExecuteAsync(sql, setParameters);
    }

    public async Task DeleteAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("delete from blog_posts where id = @Id;", new { Id = id });
    }

    public async Task<long> CountAsync()
    {
        await using var conn = await db.OpenConnectionAsync();
        return await conn.ExecuteScalarAsync<long>("select count(*) from blog_posts;");
    }

    public async Task InsertManyAsync(IEnumerable<BlogPost> posts)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into blog_posts (
                id, title, slug, excerpt, content, cover_image, tags, is_published, created_at, updated_at
            )
            values (
                @Id, @Title, @Slug, @Excerpt, @Content, @CoverImage, @Tags::jsonb, @IsPublished,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now()), coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, posts);
    }
}

/// <summary>Postgres-backed media repository.</summary>
public class MediaRepository(PostgresDb db) : IMediaRepository
{
    public async Task<List<MediaItem>> ListWithoutDataAsync(int limit)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, filename, content_type, size,
                created_at::text as created_at, uploaded_by
            from media
            order by created_at desc
            limit @Limit;
            """;
        return (await conn.QueryAsync<MediaItem>(sql, new { Limit = limit })).ToList();
    }

    public async Task<MediaItem?> FindByIdAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, filename, content_type, size, data,
                created_at::text as created_at, uploaded_by
            from media
            where id = @Id;
            """;
        return await conn.QuerySingleOrDefaultAsync<MediaItem>(sql, new { Id = id });
    }

    public async Task InsertAsync(MediaItem item)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into media (
                id, filename, content_type, size, data, created_at, uploaded_by
            )
            values (
                @Id, @Filename, @ContentType, @Size, @Data,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now()), @UploadedBy
            );
            """;
        await conn.ExecuteAsync(sql, item);
    }

    public async Task DeleteAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("delete from media where id = @Id;", new { Id = id });
    }
}

/// <summary>Postgres-backed activity log repository.</summary>
public class ActivityLogRepository(PostgresDb db) : IActivityLogRepository
{
    public async Task InsertAsync(ActivityLog log)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into activity_logs (
                id, user_id, user_email, user_name, action, target, meta, created_at
            )
            values (
                @Id, @UserId, @UserEmail, @UserName, @Action, @Target, @Meta::jsonb,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, log);
    }

    public async Task<List<ActivityLog>> ListAsync(int limit, string? action)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, user_id, user_email, user_name, action, target, meta,
                created_at::text as created_at
            from activity_logs
            where (@Action is null or action = @Action)
            order by created_at desc
            limit @Limit;
            """;
        return (await conn.QueryAsync<ActivityLog>(sql, new { Action = action, Limit = limit })).ToList();
    }
}

/// <summary>Postgres-backed payment repository.</summary>
public class PaymentRepository(PostgresDb db) : IPaymentRepository
{
    private const string PaymentSelect = """
        select
          id as Id,
          order_id as OrderId,
          method as Method,
          amount as Amount,
          status as Status,
          transaction_id as TransactionId,
          created_at::text as CreatedAt
        from payments
        """;

    public async Task InsertAsync(Payment payment)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into payments (
                id, order_id, method, amount, status, transaction_id, created_at
            )
            values (
                @Id, @OrderId, @Method, @Amount, @Status, @TransactionId,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, payment);
    }

    public async Task<Payment?> FindByIdAsync(string id)
    {
        var sql = $"{PaymentSelect} where id = @Id limit 1;";
        await using var conn = await db.OpenConnectionAsync();
        return await conn.QuerySingleOrDefaultAsync<Payment>(sql, new { Id = id });
    }

    public async Task<Payment?> FindByOrderIdAsync(string orderId)
    {
        var sql = $"{PaymentSelect} where order_id = @OrderId order by created_at desc limit 1;";
        await using var conn = await db.OpenConnectionAsync();
        return await conn.QuerySingleOrDefaultAsync<Payment>(sql, new { OrderId = orderId });
    }

    public async Task<List<BillingRow>> AdminListAsync(string? status, string? q, int limit)
    {
        const string sql = """
            select
              p.id as Id,
              p.order_id as OrderId,
              o.order_no as OrderNo,
              o.user_email as UserEmail,
              p.method as Method,
              p.amount as Amount,
              p.status as Status,
              p.transaction_id as TransactionId,
              o.status as OrderStatus,
              p.created_at::text as CreatedAt
            from payments p
            inner join orders o on o.id = p.order_id
            where (@Status is null or p.status = @Status)
              and (
                    @Query is null
                    or o.order_no ilike ('%' || @Query || '%')
                    or o.user_email ilike ('%' || @Query || '%')
                    or p.transaction_id ilike ('%' || @Query || '%')
                  )
            order by p.created_at desc
            limit @Limit;
            """;
        await using var conn = await db.OpenConnectionAsync();
        var items = await conn.QueryAsync<BillingRow>(sql, new { Status = status, Query = q, Limit = limit });
        return items.ToList();
    }

    public async Task UpdateStatusAsync(string id, string status)
    {
        const string sql = "update payments set status = @Status where id = @Id;";
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync(sql, new { Id = id, Status = status });
    }

    public async Task DeleteByOrderIdAsync(string orderId)
    {
        const string sql = "delete from payments where order_id = @OrderId;";
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync(sql, new { OrderId = orderId });
    }
}

/// <summary>Postgres-backed password reset repository.</summary>
public class PasswordResetRepository(PostgresDb db) : IPasswordResetRepository
{
    public async Task<PasswordReset?> FindValidTokenAsync(string token)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, token, user_id, expires_at::text as expires_at, used, created_at::text as created_at
            from password_resets
            where token = @Token
              and used = false
              and expires_at > now();
            """;
        return await conn.QuerySingleOrDefaultAsync<PasswordReset>(sql, new { Token = token });
    }

    public async Task InsertAsync(PasswordReset reset)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into password_resets (
                id, token, user_id, expires_at, used, created_at
            )
            values (
                @Id, @Token, @UserId, coalesce(nullif(@ExpiresAt, '')::timestamptz, now()),
                @Used, coalesce(nullif(@CreatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, reset);
    }

    public async Task MarkUsedAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("update password_resets set used = true where id = @Id;", new { Id = id });
    }
}

/// <summary>Postgres-backed email log repository.</summary>
public class EmailLogRepository(PostgresDb db) : IEmailLogRepository
{
    public async Task InsertAsync(EmailLog log)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into email_log (
                id, recipient, template, body, context, created_at
            )
            values (
                @Id, @To, @Template, @Body, @Context::jsonb, coalesce(nullif(@CreatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, log);
    }
}

/// <summary>Postgres-backed newsletter repository.</summary>
public class NewsletterRepository(PostgresDb db) : INewsletterRepository
{
    public async Task UpsertAsync(string email, string id, string createdAt)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into newsletter (id, email, created_at)
            values (@Id, @Email, coalesce(nullif(@CreatedAt, '')::timestamptz, now()))
            on conflict (email) do update
            set email = excluded.email;
            """;
        await conn.ExecuteAsync(sql, new { Id = id, Email = email, CreatedAt = createdAt });
    }
}

/// <summary>Postgres-backed contact message repository.</summary>
public class ContactRepository(PostgresDb db) : IContactRepository
{
    public async Task InsertAsync(ContactMessage message)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into contact_messages (
                id, name, email, subject, message, created_at
            )
            values (
                @Id, @Name, @Email, @Subject, @Message, coalesce(nullif(@CreatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, message);
    }
}

/// <summary>Postgres-backed RBAC repository mapped to Supabase RBAC tables.</summary>
public class RbacRepository(PostgresDb db) : IRbacRepository
{
    private const string DefaultTenantId = "00000000-0000-0000-0000-000000000001";

    public async Task UpsertModuleAsync(ModuleEntity module)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into modules (module_id, name, description, metadata)
            values (@ModuleId, @Name, @Description, @Metadata::jsonb)
            on conflict (module_id) do update
            set name = excluded.name,
                description = excluded.description,
                metadata = excluded.metadata;
            """;
        await conn.ExecuteAsync(sql, module);
    }

    public async Task<List<ModuleEntity>> ListModulesAsync()
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select module_id, name, description, metadata
            from modules
            order by module_id
            limit 200;
            """;
        return (await conn.QueryAsync<ModuleEntity>(sql)).ToList();
    }

    public async Task<Role?> FindRoleBySlugAsync(string slug)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id::text as id, name, slug, description, tenant_id::text as tenant_id, metadata,
                created_at::text as created_at
            from roles
            where slug = @Slug and tenant_id = @TenantId::uuid;
            """;
        return await conn.QuerySingleOrDefaultAsync<Role>(sql, new { Slug = slug, TenantId = DefaultTenantId });
    }

    public async Task<Role?> FindRoleByIdAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id::text as id, name, slug, description, tenant_id::text as tenant_id, metadata,
                created_at::text as created_at
            from roles
            where id = @Id::uuid and tenant_id = @TenantId::uuid;
            """;
        return await conn.QuerySingleOrDefaultAsync<Role>(sql, new { Id = id, TenantId = DefaultTenantId });
    }

    public async Task InsertRoleAsync(Role role)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into roles (
                id, tenant_id, name, slug, description, metadata, created_at
            )
            values (
                coalesce(nullif(@Id, ''), gen_random_uuid()::text)::uuid,
                @TenantId::uuid, @Name, @Slug, @Description, @Metadata::jsonb,
                coalesce(nullif(@CreatedAt, '')::timestamptz, now())
            );
            """;
        await conn.ExecuteAsync(sql, new
        {
            role.Id,
            TenantId = DefaultTenantId,
            role.Name,
            role.Slug,
            role.Description,
            role.Metadata,
            role.CreatedAt,
        });
    }

    public async Task<List<Role>> ListRolesAsync()
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id::text as id, name, slug, description, tenant_id::text as tenant_id, metadata,
                created_at::text as created_at
            from roles
            where tenant_id = @TenantId::uuid
            order by name
            limit 100;
            """;
        return (await conn.QueryAsync<Role>(sql, new { TenantId = DefaultTenantId })).ToList();
    }

    public async Task UpdateRoleAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        await using var conn = await db.OpenConnectionAsync();
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        parameters.Add("tenantId", DefaultTenantId);
        var (setClause, setParameters) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update roles set {setClause} where id = @id::uuid and tenant_id = @tenantId::uuid;";
        await conn.ExecuteAsync(sql, setParameters);
    }

    public async Task DeleteRoleAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync(
            "delete from roles where id = @Id::uuid and tenant_id = @TenantId::uuid;",
            new { Id = id, TenantId = DefaultTenantId });
    }

    public async Task<long> CountUsersWithRoleAsync(string roleId)
    {
        await using var conn = await db.OpenConnectionAsync();
        return await conn.ExecuteScalarAsync<long>(
            "select count(*) from users where role_id = @RoleId;",
            new { RoleId = roleId });
    }

    public async Task UpsertRolePermissionAsync(string roleId, string moduleId, int bits)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            insert into role_permissions (role_id, module_id, permission_bits)
            values (@RoleId::uuid, @ModuleId, @PermissionBits)
            on conflict (role_id, module_id) do update
            set permission_bits = excluded.permission_bits;
            """;
        await conn.ExecuteAsync(sql, new { RoleId = roleId, ModuleId = moduleId, PermissionBits = bits });
    }

    public async Task DeleteRolePermissionsAsync(string roleId)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("delete from role_permissions where role_id = @RoleId::uuid;", new { RoleId = roleId });
    }

    public async Task<Dictionary<string, int>> GetRolePermissionsAsync(string roleId)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = "select module_id as ModuleId, permission_bits as PermissionBits from role_permissions where role_id = @RoleId::uuid;";
        var perms = await conn.QueryAsync<RolePermission>(sql, new { RoleId = roleId });
        return perms.ToDictionary(p => p.ModuleId, p => p.PermissionBits);
    }

    public async Task<Dictionary<string, int>> GetUserOverridesAsync(string userId)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = "select module_id as ModuleId, permission_bits as PermissionBits from user_permissions where user_id = @UserId;";
        var perms = await conn.QueryAsync<UserPermission>(sql, new { UserId = userId });
        return perms.ToDictionary(p => p.ModuleId, p => p.PermissionBits);
    }

    public async Task ReplaceUserPermissionsAsync(string userId, IEnumerable<UserPermission> permissions)
    {
        await using var conn = await db.OpenConnectionAsync();
        await using var tx = await conn.BeginTransactionAsync();

        await conn.ExecuteAsync("delete from user_permissions where user_id = @UserId;", new { UserId = userId }, tx);
        var list = permissions.Where(p => p.PermissionBits > 0).ToList();
        if (list.Count > 0)
        {
            const string insertSql = """
                insert into user_permissions (user_id, module_id, permission_bits, metadata)
                values (@UserId, @ModuleId, @PermissionBits, @Metadata::jsonb);
                """;
            await conn.ExecuteAsync(insertSql, list, tx);
        }

        await tx.CommitAsync();
    }

    public async Task<List<User>> FindUsersByRoleIdAsync(string roleId)
    {
        await using var conn = await db.OpenConnectionAsync();
        const string sql = """
            select
                id, email, password_hash, name, phone, role, role_id, avatar_url, email_verified,
                created_at::text as created_at
            from users
            where role_id = @RoleId;
            """;
        return (await conn.QueryAsync<User>(sql, new { RoleId = roleId })).ToList();
    }
}

/// <summary>Postgres-backed company finance ledger.</summary>
public class FinanceRepository(PostgresDb db) : IFinanceRepository
{
    private const string Select = """
        select id, kind, title, amount, category, status, reference_id as ReferenceId,
          due_date as DueDate, paid_at as PaidAt, notes, created_by as CreatedBy,
          created_at::text as CreatedAt, updated_at::text as UpdatedAt
        from finance_entries
        """;

    public async Task<List<FinanceEntry>> ListAsync(string? kind = null, int limit = 500)
    {
        var sql = kind is null
            ? Select + " order by created_at desc limit @Limit;"
            : Select + " where kind = @Kind order by created_at desc limit @Limit;";
        await using var conn = await db.OpenConnectionAsync();
        return (await conn.QueryAsync<FinanceEntry>(sql, new { Kind = kind, Limit = limit })).ToList();
    }

    public async Task<FinanceEntry?> FindByIdAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        return await conn.QuerySingleOrDefaultAsync<FinanceEntry>(Select + " where id = @Id limit 1;", new { Id = id });
    }

    public async Task InsertAsync(FinanceEntry entry)
    {
        const string sql = """
            insert into finance_entries (
              id, kind, title, amount, category, status, reference_id, due_date, paid_at,
              notes, created_by, created_at, updated_at
            ) values (
              @Id, @Kind, @Title, @Amount, @Category, @Status, @ReferenceId, @DueDate, @PaidAt,
              @Notes, @CreatedBy,
              coalesce(nullif(@CreatedAt, '')::timestamptz, now()),
              coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync(sql, entry);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync($"update finance_entries set {setClause}, updated_at = now() where id = @id;", dynamicParams);
    }

    public async Task DeleteAsync(string id)
    {
        await using var conn = await db.OpenConnectionAsync();
        await conn.ExecuteAsync("delete from finance_entries where id = @Id;", new { Id = id });
    }

    public async Task<Dictionary<string, double>> SummaryAsync()
    {
        const string sql = """
            select
              coalesce(sum(case when kind = 'income' and status = 'received' then amount else 0 end), 0) as total_income,
              coalesce(sum(case when kind = 'expense' and status = 'paid' then amount else 0 end), 0) as total_expenses,
              coalesce(sum(case when kind = 'bill' and status = 'pending' then amount else 0 end), 0) as pending_bills,
              coalesce(sum(case when kind = 'income' and status = 'pending' then amount else 0 end), 0) as pending_income
            from finance_entries;
            """;
        await using var conn = await db.OpenConnectionAsync();
        var row = await conn.QuerySingleAsync<(double total_income, double total_expenses, double pending_bills, double pending_income)>(sql);
        var available = row.total_income - row.total_expenses - row.pending_bills;
        return new Dictionary<string, double>
        {
            ["total_income"] = Math.Round(row.total_income, 2),
            ["total_expenses"] = Math.Round(row.total_expenses, 2),
            ["pending_bills"] = Math.Round(row.pending_bills, 2),
            ["pending_income"] = Math.Round(row.pending_income, 2),
            ["available_funds"] = Math.Round(available, 2),
            ["net_profit"] = Math.Round(row.total_income - row.total_expenses, 2),
        };
    }
}

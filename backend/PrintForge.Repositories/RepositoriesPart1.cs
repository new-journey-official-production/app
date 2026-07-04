using Dapper;
using PrintForge.Infrastructure.Database;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;

namespace PrintForge.Repositories;

/// <summary>Data access for users in Postgres.</summary>
public class UserRepository(PostgresDb db) : IUserRepository
{
    public async Task<User?> FindByIdAsync(string id)
    {
        const string sql = """
            select
              id, email, password_hash, name, phone, role, role_id, avatar_url, email_verified,
              created_at::text as created_at
            from users
            where id = @id
            limit 1;
            """;

        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { id });
    }

    public async Task<User?> FindByEmailAsync(string email)
    {
        const string sql = """
            select
              id, email, password_hash, name, phone, role, role_id, avatar_url, email_verified,
              created_at::text as created_at
            from users
            where email = @email
            limit 1;
            """;

        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<User>(sql, new { email });
    }

    public async Task InsertAsync(User user)
    {
        const string sql = """
            insert into users (
              id, email, password_hash, name, phone, role, role_id, avatar_url, email_verified, created_at
            ) values (
              @Id, @Email, @PasswordHash, @Name, @Phone, @Role, @RoleId, @AvatarUrl, @EmailVerified, @CreatedAt
            );
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, user);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;

        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update users set {setClause} where id = @id;";

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, dynamicParams);
    }

    public async Task<List<User>> FindCustomersAsync(int limit = 1000)
    {
        const string sql = """
            select
              id, email, password_hash, name, phone, role, role_id, avatar_url, email_verified,
              created_at::text as created_at
            from users
            where role = 'customer'
            limit @limit;
            """;

        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<User>(sql, new { limit });
        return items.ToList();
    }

    public async Task<List<User>> FindAllForAdminAsync(int limit = 500)
    {
        const string sql = """
            select
              id, email, password_hash, name, phone, role, role_id, avatar_url, email_verified,
              created_at::text as created_at
            from users
            order by created_at desc
            limit @limit;
            """;

        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<User>(sql, new { limit });
        return items.ToList();
    }

    public async Task UpdateManyByRoleAsync(string role, string roleId)
    {
        const string sql = """
            UPDATE users
            SET role_id = @roleId
            WHERE role = @role AND role_id IS NULL;
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, new { role, roleId });
    }

    public async Task<long> CountCustomersAsync()
    {
        const string sql = "select count(*)::bigint from users where role = 'customer';";
        await using var connection = await db.OpenConnectionAsync();
        return await connection.ExecuteScalarAsync<long>(sql);
    }
}

/// <summary>Data access for categories in Postgres.</summary>
public class CategoryRepository(PostgresDb db) : ICategoryRepository
{
    public async Task<List<Category>> ListAsync()
    {
        const string sql = """
            select id, name, slug, icon, image
            from categories
            order by name;
            """;

        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<Category>(sql);
        return items.ToList();
    }

    public async Task<long> CountAsync()
    {
        const string sql = "select count(*)::bigint from categories;";
        await using var connection = await db.OpenConnectionAsync();
        return await connection.ExecuteScalarAsync<long>(sql);
    }

    public async Task InsertManyAsync(IEnumerable<Category> categories)
    {
        const string sql = """
            insert into categories (id, name, slug, icon, image)
            values (@Id, @Name, @Slug, @Icon, @Image);
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, categories);
    }
}

/// <summary>Data access for products in Postgres.</summary>
public class ProductRepository(PostgresDb db) : IProductRepository
{
    private const string ProductSelect = """
        select
          id, name, slug, description, short_description, category_slug, price, discount_price, stock,
          material, weight_g, dimensions, print_time_hours, color_variants, images, tags, featured, is_active,
          seo_title, seo_description, rating_avg, rating_count, orders_count,
          created_at::text as created_at, updated_at::text as updated_at
        from products
        """;

    public async Task<(List<Product> Items, long Total)> ListAsync(ProductQuery q)
    {
        var whereClauses = new List<string>();
        var parameters = new DynamicParameters();

        if (q.ActiveOnly) whereClauses.Add("is_active = true");
        if (!string.IsNullOrWhiteSpace(q.Category))
        {
            whereClauses.Add("category_slug = @category");
            parameters.Add("category", q.Category);
        }

        if (!string.IsNullOrWhiteSpace(q.Material))
        {
            whereClauses.Add("material = @material");
            parameters.Add("material", q.Material);
        }

        if (q.Featured.HasValue)
        {
            whereClauses.Add("featured = @featured");
            parameters.Add("featured", q.Featured.Value);
        }

        if (!string.IsNullOrWhiteSpace(q.Query))
        {
            // Matches Mongo behavior: case-insensitive name/description and exact lowercase tag hit.
            whereClauses.Add("""
                (
                  name ilike @queryPattern
                  or description ilike @queryPattern
                  or exists (
                    select 1
                    from jsonb_array_elements_text(tags) as tag(value)
                    where lower(tag.value) = @queryTag
                  )
                )
                """);
            parameters.Add("queryPattern", $"%{q.Query}%");
            parameters.Add("queryTag", q.Query.ToLowerInvariant());
        }

        if (q.MinPrice.HasValue)
        {
            whereClauses.Add("price >= @minPrice");
            parameters.Add("minPrice", q.MinPrice.Value);
        }

        if (q.MaxPrice.HasValue)
        {
            whereClauses.Add("price <= @maxPrice");
            parameters.Add("maxPrice", q.MaxPrice.Value);
        }

        var whereSql = whereClauses.Count > 0 ? $" where {string.Join(" and ", whereClauses)}" : string.Empty;
        var orderBySql = q.Sort switch
        {
            "price_asc" => "price asc",
            "price_desc" => "price desc",
            "rating" => "rating_avg desc",
            "popular" => "orders_count desc",
            "newest" => "created_at desc",
            _ => "created_at desc",
        };

        const string countPrefix = "select count(*)::bigint from products";
        var countSql = $"{countPrefix}{whereSql};";
        var listSql = $"{ProductSelect}{whereSql} order by {orderBySql} offset @skip limit @limit;";
        parameters.Add("skip", q.Skip);
        parameters.Add("limit", q.Limit);

        await using var connection = await db.OpenConnectionAsync();
        var total = await connection.ExecuteScalarAsync<long>(countSql, parameters);
        var items = (await connection.QueryAsync<Product>(listSql, parameters)).ToList();
        return (items, total);
    }

    public async Task<Product?> FindBySlugOrIdAsync(string slugOrId)
    {
        var sql = $"{ProductSelect} where slug = @slugOrId or id = @slugOrId limit 1;";
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<Product>(sql, new { slugOrId });
    }

    public async Task<Product?> FindByIdAsync(string id)
    {
        var sql = $"{ProductSelect} where id = @id limit 1;";
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<Product>(sql, new { id });
    }

    public async Task<Product?> FindBySlugAsync(string slug)
    {
        var sql = $"{ProductSelect} where slug = @slug limit 1;";
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<Product>(sql, new { slug });
    }

    public async Task InsertAsync(Product product)
    {
        const string sql = """
            insert into products (
              id, name, slug, description, short_description, category_slug, price, discount_price, stock,
              material, weight_g, dimensions, print_time_hours, color_variants, images, tags, featured, is_active,
              seo_title, seo_description, rating_avg, rating_count, orders_count, created_at, updated_at
            ) values (
              @Id, @Name, @Slug, @Description, @ShortDescription, @CategorySlug, @Price, @DiscountPrice, @Stock,
              @Material, @WeightG, @Dimensions, @PrintTimeHours, @ColorVariants, @Images, @Tags, @Featured, @IsActive,
              @SeoTitle, @SeoDescription, @RatingAvg, @RatingCount, @OrdersCount, @CreatedAt, @UpdatedAt
            );
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, product);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;

        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update products set {setClause} where id = @id;";

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, dynamicParams);
    }

    public async Task DeleteAsync(string id)
    {
        const string sql = "delete from products where id = @id;";
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, new { id });
    }

    public async Task<List<Product>> FindByIdsAsync(IEnumerable<string> ids)
    {
        var idArray = ids.Distinct().ToArray();
        if (idArray.Length == 0) return [];

        var sql = $"{ProductSelect} where id = any(@ids);";
        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<Product>(sql, new { ids = idArray });
        return items.ToList();
    }

    public async Task<List<Product>> FindRelatedAsync(string categorySlug, string excludeId, int limit = 6)
    {
        var sql = $"{ProductSelect} where category_slug = @categorySlug and id <> @excludeId and is_active = true limit @limit;";
        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<Product>(sql, new { categorySlug, excludeId, limit });
        return items.ToList();
    }

    public async Task<List<Product>> ListAllAsync(int limit = 5000)
    {
        var sql = $"{ProductSelect} limit @limit;";
        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<Product>(sql, new { limit });
        return items.ToList();
    }

    public async Task IncrementStockAsync(string productId, int delta, int orderDelta = 0)
    {
        const string sql = """
            UPDATE products
            SET stock = stock + @delta, orders_count = orders_count + @orderDelta
            WHERE id = @id;
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, new { id = productId, delta, orderDelta });
    }
}

/// <summary>Data access for reviews in Postgres.</summary>
public class ReviewRepository(PostgresDb db) : IReviewRepository
{
    private const string ReviewSelect = """
        select id, product_id, user_id, user_name, rating, title, comment, approved, created_at::text as created_at
        from reviews
        """;

    public async Task InsertAsync(Review review)
    {
        const string sql = """
            insert into reviews (
              id, product_id, user_id, user_name, rating, title, comment, approved, created_at
            ) values (
              @Id, @ProductId, @UserId, @UserName, @Rating, @Title, @Comment, @Approved, @CreatedAt
            );
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, review);
    }

    public async Task<List<Review>> FindByProductAsync(string productId, bool approvedOnly = true)
    {
        var whereSql = approvedOnly
            ? " where product_id = @productId and approved = true"
            : " where product_id = @productId";
        var sql = $"{ReviewSelect}{whereSql} order by created_at desc limit 50;";

        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<Review>(sql, new { productId });
        return items.ToList();
    }

    public async Task<List<Review>> ListAllAsync(int limit = 200)
    {
        var sql = $"{ReviewSelect} order by created_at desc limit @limit;";
        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<Review>(sql, new { limit });
        return items.ToList();
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;

        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update reviews set {setClause} where id = @id;";

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, dynamicParams);
    }

    public async Task<List<Review>> FindApprovedByProductAsync(string productId)
    {
        var sql = $"{ReviewSelect} where product_id = @productId and approved = true;";
        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<Review>(sql, new { productId });
        return items.ToList();
    }
}

/// <summary>Data access for wishlist items in Postgres.</summary>
public class WishlistRepository(PostgresDb db) : IWishlistRepository
{
    public async Task<List<WishlistItem>> FindByUserAsync(string userId)
    {
        const string sql = """
            select id, user_id, product_id, created_at::text as created_at
            from wishlist
            where user_id = @userId;
            """;

        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<WishlistItem>(sql, new { userId });
        return items.ToList();
    }

    public async Task<bool> ExistsAsync(string userId, string productId)
    {
        const string sql = """
            select exists(
                select 1 from wishlist where user_id = @userId and product_id = @productId
            );
            """;

        await using var connection = await db.OpenConnectionAsync();
        return await connection.ExecuteScalarAsync<bool>(sql, new { userId, productId });
    }

    public async Task InsertAsync(WishlistItem item)
    {
        const string sql = """
            insert into wishlist (id, user_id, product_id, created_at)
            values (@Id, @UserId, @ProductId, @CreatedAt);
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, item);
    }

    public async Task DeleteAsync(string userId, string productId)
    {
        const string sql = "delete from wishlist where user_id = @userId and product_id = @productId;";
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, new { userId, productId });
    }
}

/// <summary>Data access for user addresses in Postgres.</summary>
public class AddressRepository(PostgresDb db) : IAddressRepository
{
    private const string AddressSelect = """
        select
          id, user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default,
          created_at::text as created_at
        from addresses
        """;

    public async Task<List<Address>> FindByUserAsync(string userId)
    {
        var sql = $"{AddressSelect} where user_id = @userId limit 50;";
        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<Address>(sql, new { userId });
        return items.ToList();
    }

    public async Task<Address?> FindByIdAndUserAsync(string id, string userId)
    {
        var sql = $"{AddressSelect} where id = @id and user_id = @userId limit 1;";
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<Address>(sql, new { id, userId });
    }

    public async Task InsertAsync(Address address)
    {
        const string sql = """
            insert into addresses (
              id, user_id, label, full_name, phone, line1, line2, city, state, postal_code, country, is_default, created_at
            ) values (
              @Id, @UserId, @Label, @FullName, @Phone, @Line1, @Line2, @City, @State, @PostalCode, @Country, @IsDefault, @CreatedAt
            );
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, address);
    }

    public async Task UpdateAsync(string id, string userId, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;

        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        parameters.Add("userId", userId);
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        var sql = $"update addresses set {setClause} where id = @id and user_id = @userId;";

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, dynamicParams);
    }

    public async Task ClearDefaultAsync(string userId)
    {
        const string sql = "update addresses set is_default = false where user_id = @userId;";
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, new { userId });
    }

    public async Task DeleteAsync(string id, string userId)
    {
        const string sql = "delete from addresses where id = @id and user_id = @userId;";
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, new { id, userId });
    }
}

/// <summary>Data access for coupons in Postgres.</summary>
public class CouponRepository(PostgresDb db) : ICouponRepository
{
    private const string CouponSelect = """
        select
          id, code, kind, value, min_order, max_discount, is_active, expires_at::text as expires_at,
          created_at::text as created_at
        from coupons
        """;

    public async Task<Coupon?> FindByCodeAsync(string code)
    {
        var sql = $"{CouponSelect} where code = @code and is_active = true limit 1;";
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<Coupon>(sql, new { code = code.ToUpperInvariant() });
    }

    public async Task<List<Coupon>> ListAsync()
    {
        var sql = $"{CouponSelect} order by code limit 200;";
        await using var connection = await db.OpenConnectionAsync();
        var items = await connection.QueryAsync<Coupon>(sql);
        return items.ToList();
    }

    public async Task InsertAsync(Coupon coupon)
    {
        const string sql = """
            insert into coupons (
              id, code, kind, value, min_order, max_discount, is_active, expires_at, created_at
            ) values (
              @Id, @Code, @Kind, @Value, @MinOrder, @MaxDiscount, @IsActive, @ExpiresAt, @CreatedAt
            );
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, coupon);
    }

    public async Task DeleteAsync(string id)
    {
        const string sql = "delete from coupons where id = @id;";
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, new { id });
    }

    public async Task<long> CountAsync()
    {
        const string sql = "select count(*)::bigint from coupons;";
        await using var connection = await db.OpenConnectionAsync();
        return await connection.ExecuteScalarAsync<long>(sql);
    }

    public async Task InsertManyAsync(IEnumerable<Coupon> coupons)
    {
        const string sql = """
            insert into coupons (
              id, code, kind, value, min_order, max_discount, is_active, expires_at, created_at
            ) values (
              @Id, @Code, @Kind, @Value, @MinOrder, @MaxDiscount, @IsActive, @ExpiresAt, @CreatedAt
            );
            """;

        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, coupons);
    }
}

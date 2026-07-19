using Dapper;
using PrintForge.Infrastructure.Database;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;

namespace PrintForge.Repositories;

/// <summary>Postgres data access for the B2B catalog module.</summary>
public class B2bCategoryRepository(PostgresDb db) : IB2bCategoryRepository
{
    private const string Select = """
        select id, name, slug, parent_id as ParentId, short_description as ShortDescription,
          long_description as LongDescription, banner, cover_image as CoverImage, icon,
          seo_title as SeoTitle, seo_description as SeoDescription, status,
          display_order as DisplayOrder, featured, visibility,
          created_at::text as CreatedAt, updated_at::text as UpdatedAt
        from b2b_categories
        """;

    public async Task<List<B2bCategory>> ListAsync(bool includeArchived = false)
    {
        var sql = includeArchived
            ? Select + " order by display_order, name;"
            : Select + " where status <> 'archived' order by display_order, name;";
        await using var connection = await db.OpenConnectionAsync();
        return (await connection.QueryAsync<B2bCategory>(sql)).ToList();
    }

    public async Task<B2bCategory?> FindByIdAsync(string id)
    {
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<B2bCategory>(Select + " where id = @id limit 1;", new { id });
    }

    public async Task<B2bCategory?> FindBySlugAsync(string slug)
    {
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<B2bCategory>(Select + " where slug = @slug limit 1;", new { slug });
    }

    public async Task InsertAsync(B2bCategory c)
    {
        const string sql = """
            insert into b2b_categories (
              id, name, slug, parent_id, short_description, long_description, banner, cover_image, icon,
              seo_title, seo_description, status, display_order, featured, visibility, created_at, updated_at
            ) values (
              @Id, @Name, @Slug, @ParentId, @ShortDescription, @LongDescription, @Banner, @CoverImage, @Icon,
              @SeoTitle, @SeoDescription, @Status, @DisplayOrder, @Featured, @Visibility,
              coalesce(nullif(@CreatedAt, '')::timestamptz, now()),
              coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, c);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync($"update b2b_categories set {setClause}, updated_at = now() where id = @id;", dynamicParams);
    }

    public async Task DeleteAsync(string id)
    {
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync("delete from b2b_categories where id = @id;", new { id });
    }

    public async Task<long> CountAsync(string? status = null, string? visibility = null)
    {
        var where = new List<string>();
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(status)) { where.Add("status = @status"); p.Add("status", status); }
        if (!string.IsNullOrWhiteSpace(visibility)) { where.Add("visibility = @visibility"); p.Add("visibility", visibility); }
        var sql = "select count(*)::bigint from b2b_categories" + (where.Count > 0 ? " where " + string.Join(" and ", where) : "");
        await using var connection = await db.OpenConnectionAsync();
        return await connection.ExecuteScalarAsync<long>(sql, p);
    }

    public async Task ReorderAsync(IReadOnlyList<(string Id, int Order)> items)
    {
        await using var connection = await db.OpenConnectionAsync();
        foreach (var (id, order) in items)
            await connection.ExecuteAsync(
                "update b2b_categories set display_order = @order, updated_at = now() where id = @id;",
                new { id, order });
    }
}

/// <summary>Postgres data access for B2B products.</summary>
public class B2bProductRepository(PostgresDb db) : IB2bProductRepository
{
    private const string Select = """
        select
          id, name, sku, slug, category_id as CategoryId, subcategory_id as SubcategoryId, brand, status,
          featured, best_seller as BestSeller, new_arrival as NewArrival,
          retail_price as RetailPrice, wholesale_price as WholesalePrice, dealer_price as DealerPrice,
          min_order_qty as MinOrderQty, recommended_moq as RecommendedMoq,
          gst_percent as GstPercent, discount_percent as DiscountPercent, offer_price as OfferPrice,
          material, printer, printing_technology as PrintingTechnology, layer_height as LayerHeight,
          nozzle_size as NozzleSize, infill, weight_g as WeightG, dimensions,
          production_time as ProductionTime, lead_time as LeadTime, packaging,
          country_of_origin as CountryOfOrigin, colors, customization,
          hero_image as HeroImage, gallery, lifestyle_images as LifestyleImages,
          white_bg_images as WhiteBgImages, transparent_images as TransparentImages,
          images_360 as Images360, videos, overview, features, applications, benefits,
          specifications, package_contents as PackageContents, care_instructions as CareInstructions,
          faqs, is_visible as IsVisible, is_downloadable as IsDownloadable,
          show_price as ShowPrice, show_moq as ShowMoq, show_lead_time as ShowLeadTime,
          recommended, coming_soon as ComingSoon,
          seo_title as SeoTitle, seo_description as SeoDescription, seo_keywords as SeoKeywords,
          og_image as OgImage, twitter_card as TwitterCard, canonical_url as CanonicalUrl,
          views_count as ViewsCount, downloads_count as DownloadsCount,
          quote_requests_count as QuoteRequestsCount, shares_count as SharesCount,
          whatsapp_clicks_count as WhatsappClicksCount,
          created_at::text as CreatedAt, updated_at::text as UpdatedAt
        from b2b_products
        """;

    public async Task<(List<B2bProduct> Items, long Total)> ListAsync(B2bProductQuery q)
    {
        var where = new List<string>();
        var p = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(q.CategoryId)) { where.Add("(category_id = @cat or subcategory_id = @cat)"); p.Add("cat", q.CategoryId); }
        if (!string.IsNullOrWhiteSpace(q.SubcategoryId)) { where.Add("subcategory_id = @sub"); p.Add("sub", q.SubcategoryId); }
        if (!string.IsNullOrWhiteSpace(q.Query))
        {
            where.Add("(name ilike @q or sku ilike @q or brand ilike @q or overview ilike @q)");
            p.Add("q", "%" + q.Query.Trim() + "%");
        }
        if (!string.IsNullOrWhiteSpace(q.Material)) { where.Add("material ilike @mat"); p.Add("mat", q.Material); }
        if (!string.IsNullOrWhiteSpace(q.Color)) { where.Add("colors::text ilike @color"); p.Add("color", "%" + q.Color + "%"); }
        if (q.MinPrice.HasValue) { where.Add("wholesale_price >= @minp"); p.Add("minp", q.MinPrice.Value); }
        if (q.MaxPrice.HasValue) { where.Add("wholesale_price <= @maxp"); p.Add("maxp", q.MaxPrice.Value); }
        if (q.MaxMoq.HasValue) { where.Add("min_order_qty <= @moq"); p.Add("moq", q.MaxMoq.Value); }
        if (q.Featured == true) where.Add("featured = true");
        if (q.BestSeller == true) where.Add("best_seller = true");
        if (q.NewArrival == true) where.Add("new_arrival = true");
        if (q.Customization == true) where.Add("(customization->>'custom_logo' = 'true' or customization->>'private_label' = 'true')");
        if (!string.IsNullOrWhiteSpace(q.Status)) { where.Add("status = @status"); p.Add("status", q.Status); }
        if (q.VisibleOnly == true) where.Add("is_visible = true and status = 'published'");

        var whereSql = where.Count > 0 ? " where " + string.Join(" and ", where) : "";
        var order = q.Sort switch
        {
            "price_asc" => "wholesale_price asc",
            "price_desc" => "wholesale_price desc",
            "newest" => "created_at desc",
            "best_seller" => "best_seller desc, downloads_count desc",
            "downloads" => "downloads_count desc",
            "views" => "views_count desc",
            "moq" => "min_order_qty asc",
            _ => "featured desc, created_at desc"
        };

        p.Add("limit", q.Limit);
        p.Add("skip", q.Skip);

        await using var connection = await db.OpenConnectionAsync();
        var total = await connection.ExecuteScalarAsync<long>("select count(*)::bigint from b2b_products" + whereSql, p);
        var items = (await connection.QueryAsync<B2bProduct>(
            Select + whereSql + $" order by {order} limit @limit offset @skip;", p)).ToList();
        return (items, total);
    }

    public async Task<B2bProduct?> FindByIdAsync(string id)
    {
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<B2bProduct>(Select + " where id = @id limit 1;", new { id });
    }

    public async Task<B2bProduct?> FindBySlugAsync(string slug)
    {
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<B2bProduct>(Select + " where slug = @slug limit 1;", new { slug });
    }

    public async Task<B2bProduct?> FindBySlugOrIdAsync(string slugOrId)
    {
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<B2bProduct>(
            Select + " where id = @v or slug = @v limit 1;", new { v = slugOrId });
    }

    public async Task InsertAsync(B2bProduct p)
    {
        const string sql = """
            insert into b2b_products (
              id, name, sku, slug, category_id, subcategory_id, brand, status, featured, best_seller, new_arrival,
              retail_price, wholesale_price, dealer_price, min_order_qty, recommended_moq, gst_percent, discount_percent, offer_price,
              material, printer, printing_technology, layer_height, nozzle_size, infill, weight_g, dimensions,
              production_time, lead_time, packaging, country_of_origin, colors, customization,
              hero_image, gallery, lifestyle_images, white_bg_images, transparent_images, images_360, videos,
              overview, features, applications, benefits, specifications, package_contents, care_instructions, faqs,
              is_visible, is_downloadable, show_price, show_moq, show_lead_time, recommended, coming_soon,
              seo_title, seo_description, seo_keywords, og_image, twitter_card, canonical_url,
              views_count, downloads_count, quote_requests_count, shares_count, whatsapp_clicks_count,
              created_at, updated_at
            ) values (
              @Id, @Name, @Sku, @Slug, @CategoryId, @SubcategoryId, @Brand, @Status, @Featured, @BestSeller, @NewArrival,
              @RetailPrice, @WholesalePrice, @DealerPrice, @MinOrderQty, @RecommendedMoq, @GstPercent, @DiscountPercent, @OfferPrice,
              @Material, @Printer, @PrintingTechnology, @LayerHeight, @NozzleSize, @Infill, @WeightG, @Dimensions,
              @ProductionTime, @LeadTime, @Packaging, @CountryOfOrigin, @Colors, @Customization,
              @HeroImage, @Gallery, @LifestyleImages, @WhiteBgImages, @TransparentImages, @Images360, @Videos,
              @Overview, @Features, @Applications, @Benefits, @Specifications, @PackageContents, @CareInstructions, @Faqs,
              @IsVisible, @IsDownloadable, @ShowPrice, @ShowMoq, @ShowLeadTime, @Recommended, @ComingSoon,
              @SeoTitle, @SeoDescription, @SeoKeywords, @OgImage, @TwitterCard, @CanonicalUrl,
              @ViewsCount, @DownloadsCount, @QuoteRequestsCount, @SharesCount, @WhatsappClicksCount,
              coalesce(nullif(@CreatedAt, '')::timestamptz, now()),
              coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, p);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync($"update b2b_products set {setClause}, updated_at = now() where id = @id;", dynamicParams);
    }

    public async Task DeleteAsync(string id)
    {
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync("delete from b2b_products where id = @id;", new { id });
    }

    public async Task<long> CountAsync(string? status = null, bool? visible = null, bool? featured = null, bool? bestSeller = null)
    {
        var where = new List<string>();
        var p = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(status)) { where.Add("status = @status"); p.Add("status", status); }
        if (visible.HasValue) { where.Add("is_visible = @vis"); p.Add("vis", visible.Value); }
        if (featured == true) where.Add("featured = true");
        if (bestSeller == true) where.Add("best_seller = true");
        var sql = "select count(*)::bigint from b2b_products" + (where.Count > 0 ? " where " + string.Join(" and ", where) : "");
        await using var connection = await db.OpenConnectionAsync();
        return await connection.ExecuteScalarAsync<long>(sql, p);
    }

    public async Task IncrementCounterAsync(string id, string column, long delta = 1)
    {
        var allowed = new HashSet<string>
        {
            "views_count", "downloads_count", "quote_requests_count", "shares_count", "whatsapp_clicks_count"
        };
        if (!allowed.Contains(column)) throw new ArgumentException($"Invalid counter column: {column}");
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(
            $"update b2b_products set {column} = {column} + @delta, updated_at = now() where id = @id;",
            new { id, delta });
    }

    public async Task<List<B2bProduct>> FindByIdsAsync(IEnumerable<string> ids)
    {
        var idList = ids.ToList();
        if (idList.Count == 0) return [];
        await using var connection = await db.OpenConnectionAsync();
        return (await connection.QueryAsync<B2bProduct>(Select + " where id = any(@ids::text[]);", new { ids = idList.ToArray() })).ToList();
    }

    public async Task<List<B2bProduct>> FindRelatedAsync(string? categoryId, string excludeId, int limit = 6)
    {
        await using var connection = await db.OpenConnectionAsync();
        return (await connection.QueryAsync<B2bProduct>(
            Select + """
                 where id <> @excludeId and status = 'published' and is_visible = true
                   and (@categoryId is null or category_id = @categoryId or subcategory_id = @categoryId)
                 order by featured desc, downloads_count desc
                 limit @limit;
                """,
            new { categoryId, excludeId, limit })).ToList();
    }

    public async Task<B2bProduct?> FindTopByCounterAsync(string column)
    {
        var allowed = new HashSet<string> { "views_count", "downloads_count", "quote_requests_count", "shares_count" };
        if (!allowed.Contains(column)) throw new ArgumentException($"Invalid counter: {column}");
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<B2bProduct>(
            Select + $" where status = 'published' order by {column} desc limit 1;");
    }
}

public class B2bQuoteRepository(PostgresDb db) : IB2bQuoteRepository
{
    private const string Select = """
        select id, business_name as BusinessName, owner_name as OwnerName, phone, email, gst, address,
          product_id as ProductId, product_name as ProductName, quantity, customization, message,
          status, admin_notes as AdminNotes, created_at::text as CreatedAt, updated_at::text as UpdatedAt
        from b2b_quote_requests
        """;

    public async Task<(List<B2bQuoteRequest> Items, long Total)> ListAsync(string? status, int limit, int skip)
    {
        var p = new DynamicParameters();
        p.Add("limit", limit);
        p.Add("skip", skip);
        var where = "";
        if (!string.IsNullOrWhiteSpace(status)) { where = " where status = @status"; p.Add("status", status); }
        await using var connection = await db.OpenConnectionAsync();
        var total = await connection.ExecuteScalarAsync<long>("select count(*)::bigint from b2b_quote_requests" + where, p);
        var items = (await connection.QueryAsync<B2bQuoteRequest>(
            Select + where + " order by created_at desc limit @limit offset @skip;", p)).ToList();
        return (items, total);
    }

    public async Task<B2bQuoteRequest?> FindByIdAsync(string id)
    {
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<B2bQuoteRequest>(Select + " where id = @id limit 1;", new { id });
    }

    public async Task InsertAsync(B2bQuoteRequest q)
    {
        const string sql = """
            insert into b2b_quote_requests (
              id, business_name, owner_name, phone, email, gst, address, product_id, product_name,
              quantity, customization, message, status, admin_notes, created_at, updated_at
            ) values (
              @Id, @BusinessName, @OwnerName, @Phone, @Email, @Gst, @Address, @ProductId, @ProductName,
              @Quantity, @Customization, @Message, @Status, @AdminNotes,
              coalesce(nullif(@CreatedAt, '')::timestamptz, now()),
              coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, q);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync($"update b2b_quote_requests set {setClause}, updated_at = now() where id = @id;", dynamicParams);
    }

    public async Task DeleteAsync(string id)
    {
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync("delete from b2b_quote_requests where id = @id;", new { id });
    }

    public async Task<long> CountAsync(string? status = null)
    {
        await using var connection = await db.OpenConnectionAsync();
        if (string.IsNullOrWhiteSpace(status))
            return await connection.ExecuteScalarAsync<long>("select count(*)::bigint from b2b_quote_requests;");
        return await connection.ExecuteScalarAsync<long>(
            "select count(*)::bigint from b2b_quote_requests where status = @status;", new { status });
    }
}

public class B2bDealerRepository(PostgresDb db) : IB2bDealerRepository
{
    private const string Select = """
        select id, company_name as CompanyName, owner_name as OwnerName, phone, email, gst, address,
          business_type as BusinessType, categories, monthly_purchase_volume as MonthlyPurchaseVolume,
          status, admin_notes as AdminNotes, created_at::text as CreatedAt, updated_at::text as UpdatedAt
        from b2b_dealers
        """;

    public async Task<(List<B2bDealer> Items, long Total)> ListAsync(string? status, int limit, int skip)
    {
        var p = new DynamicParameters();
        p.Add("limit", limit);
        p.Add("skip", skip);
        var where = "";
        if (!string.IsNullOrWhiteSpace(status)) { where = " where status = @status"; p.Add("status", status); }
        await using var connection = await db.OpenConnectionAsync();
        var total = await connection.ExecuteScalarAsync<long>("select count(*)::bigint from b2b_dealers" + where, p);
        var items = (await connection.QueryAsync<B2bDealer>(
            Select + where + " order by created_at desc limit @limit offset @skip;", p)).ToList();
        return (items, total);
    }

    public async Task<B2bDealer?> FindByIdAsync(string id)
    {
        await using var connection = await db.OpenConnectionAsync();
        return await connection.QuerySingleOrDefaultAsync<B2bDealer>(Select + " where id = @id limit 1;", new { id });
    }

    public async Task InsertAsync(B2bDealer d)
    {
        const string sql = """
            insert into b2b_dealers (
              id, company_name, owner_name, phone, email, gst, address, business_type, categories,
              monthly_purchase_volume, status, admin_notes, created_at, updated_at
            ) values (
              @Id, @CompanyName, @OwnerName, @Phone, @Email, @Gst, @Address, @BusinessType, @Categories,
              @MonthlyPurchaseVolume, @Status, @AdminNotes,
              coalesce(nullif(@CreatedAt, '')::timestamptz, now()),
              coalesce(nullif(@UpdatedAt, '')::timestamptz, now())
            );
            """;
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, d);
    }

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        var parameters = new DynamicParameters();
        parameters.Add("id", id);
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync($"update b2b_dealers set {setClause}, updated_at = now() where id = @id;", dynamicParams);
    }

    public async Task DeleteAsync(string id)
    {
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync("delete from b2b_dealers where id = @id;", new { id });
    }

    public async Task<long> CountAsync(string? status = null)
    {
        await using var connection = await db.OpenConnectionAsync();
        if (string.IsNullOrWhiteSpace(status))
            return await connection.ExecuteScalarAsync<long>("select count(*)::bigint from b2b_dealers;");
        return await connection.ExecuteScalarAsync<long>(
            "select count(*)::bigint from b2b_dealers where status = @status;", new { status });
    }
}

public class B2bAnalyticsRepository(PostgresDb db) : IB2bAnalyticsRepository
{
    public async Task InsertAsync(B2bAnalyticsEvent evt)
    {
        const string sql = """
            insert into b2b_analytics_events (id, event_type, product_id, category_id, metadata, device, country, ip_hash, created_at)
            values (@Id, @EventType, @ProductId, @CategoryId, @Metadata, @Device, @Country, @IpHash,
                    coalesce(nullif(@CreatedAt, '')::timestamptz, now()));
            """;
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync(sql, evt);
    }

    public async Task<long> CountDownloadsAsync(DateTime? from = null, DateTime? to = null) =>
        await CountEventsAsync("download", from, to);

    public async Task<long> CountEventsAsync(string eventType, DateTime? from = null, DateTime? to = null)
    {
        var where = new List<string> { "event_type = @eventType" };
        var p = new DynamicParameters();
        p.Add("eventType", eventType);
        if (from.HasValue) { where.Add("created_at >= @from"); p.Add("from", from.Value); }
        if (to.HasValue) { where.Add("created_at < @to"); p.Add("to", to.Value); }
        await using var connection = await db.OpenConnectionAsync();
        return await connection.ExecuteScalarAsync<long>(
            "select count(*)::bigint from b2b_analytics_events where " + string.Join(" and ", where), p);
    }

    public async Task<List<(string Date, long Count)>> SeriesAsync(string eventType, int days)
    {
        // Use interval multiply — string concat (@days || ' days') fails for integer params in Postgres.
        const string sql = """
            select to_char(d::date, 'YYYY-MM-DD') as date, coalesce(c.cnt, 0)::bigint as count
            from generate_series(
              (timezone('utc', now()))::date - (@days - 1),
              (timezone('utc', now()))::date,
              interval '1 day'
            ) d
            left join (
              select created_at::date as day, count(*)::bigint as cnt
              from b2b_analytics_events
              where event_type = @eventType
                and created_at >= (timezone('utc', now()))::date - (@days - 1)
              group by 1
            ) c on c.day = d::date
            order by 1;
            """;
        await using var connection = await db.OpenConnectionAsync();
        var rows = await connection.QueryAsync<(string Date, long Count)>(sql, new { eventType, days });
        return rows.ToList();
    }

    public async Task<List<(string Id, string Name, long Count)>> TopProductsAsync(string eventType, int limit = 10)
    {
        const string sql = """
            select coalesce(e.product_id, '') as id, coalesce(p.name, 'Unknown') as name, count(*)::bigint as count
            from b2b_analytics_events e
            left join b2b_products p on p.id = e.product_id
            where e.event_type = @eventType and e.product_id is not null
            group by e.product_id, p.name
            order by count desc
            limit @limit;
            """;
        await using var connection = await db.OpenConnectionAsync();
        return (await connection.QueryAsync<(string Id, string Name, long Count)>(sql, new { eventType, limit })).ToList();
    }

    public async Task<List<(string Id, string Name, long Count)>> TopCategoriesAsync(int limit = 10)
    {
        const string sql = """
            select
              cat_id as id,
              coalesce(c.name, 'Unknown') as name,
              count(*)::bigint as count
            from (
              select coalesce(nullif(e.category_id, ''), p.category_id) as cat_id
              from b2b_analytics_events e
              left join b2b_products p on p.id = e.product_id
              where e.event_type in ('view', 'download', 'quote')
            ) x
            left join b2b_categories c on c.id = x.cat_id
            where x.cat_id is not null
            group by cat_id, c.name
            order by count desc
            limit @limit;
            """;
        await using var connection = await db.OpenConnectionAsync();
        return (await connection.QueryAsync<(string Id, string Name, long Count)>(sql, new { limit })).ToList();
    }

    public async Task<List<(string Device, long Count)>> DeviceBreakdownAsync()
    {
        const string sql = """
            select coalesce(nullif(device, ''), 'unknown') as device, count(*)::bigint as count
            from b2b_analytics_events
            group by 1 order by count desc limit 20;
            """;
        await using var connection = await db.OpenConnectionAsync();
        return (await connection.QueryAsync<(string Device, long Count)>(sql)).ToList();
    }

    public async Task<List<(string Country, long Count)>> CountryBreakdownAsync()
    {
        const string sql = """
            select coalesce(nullif(country, ''), 'unknown') as country, count(*)::bigint as count
            from b2b_analytics_events
            group by 1 order by count desc limit 20;
            """;
        await using var connection = await db.OpenConnectionAsync();
        return (await connection.QueryAsync<(string Country, long Count)>(sql)).ToList();
    }
}

public class B2bSettingsRepository(PostgresDb db) : IB2bSettingsRepository
{
    private const string Select = """
        select id, company_name as CompanyName, tagline, whatsapp_number as WhatsappNumber,
          sales_email as SalesEmail, sales_phone as SalesPhone,
          catalog_cover_title as CatalogCoverTitle, default_pdf_template as DefaultPdfTemplate,
          show_dealer_price_public as ShowDealerPricePublic, hero_image as HeroImage,
          updated_at::text as UpdatedAt
        from b2b_settings
        where id = 'default'
        limit 1;
        """;

    public async Task<B2bSettings> GetAsync()
    {
        await using var connection = await db.OpenConnectionAsync();
        var row = await connection.QuerySingleOrDefaultAsync<B2bSettings>(Select);
        if (row is not null) return row;
        await connection.ExecuteAsync("insert into b2b_settings (id) values ('default') on conflict do nothing;");
        return await connection.QuerySingleAsync<B2bSettings>(Select);
    }

    public async Task UpdateAsync(Dictionary<string, object?> updates)
    {
        if (updates.Count == 0) return;
        var parameters = new DynamicParameters();
        parameters.Add("id", "default");
        var (setClause, dynamicParams) = PostgresSqlHelper.BuildSetClause(updates, parameters);
        await using var connection = await db.OpenConnectionAsync();
        await connection.ExecuteAsync($"update b2b_settings set {setClause}, updated_at = now() where id = @id;", dynamicParams);
    }
}

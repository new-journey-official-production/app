using System.Text.Json;
using PrintForge.Infrastructure.Database;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

/// <summary>Business logic for the independent B2B catalog module.</summary>
public class B2bService(
    IB2bCategoryRepository categories,
    IB2bProductRepository products,
    IB2bQuoteRepository quotes,
    IB2bDealerRepository dealers,
    IB2bAnalyticsRepository analytics,
    IB2bSettingsRepository settings,
    INotificationRepository notifications,
    IActivityLogService activity) : IB2bService
{
    private static readonly HashSet<string> CategoryImmutable = new(StringComparer.Ordinal)
        { "id", "created_at" };

    private static readonly HashSet<string> ProductImmutable = new(StringComparer.Ordinal)
    {
        "id", "created_at", "views_count", "downloads_count", "quote_requests_count",
        "shares_count", "whatsapp_clicks_count"
    };

    private static readonly HashSet<string> B2bJsonFields = new(StringComparer.Ordinal)
    {
        "colors", "customization", "gallery", "lifestyle_images", "white_bg_images",
        "transparent_images", "images_360", "videos", "faqs", "categories", "metadata"
    };

    public async Task<object> GetDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalCategories = await categories.CountAsync();
        var totalProducts = await products.CountAsync();
        var visibleProducts = await products.CountAsync(status: "published", visible: true);
        var hiddenProducts = await products.CountAsync(visible: false);
        var featuredProducts = await products.CountAsync(featured: true);
        var bestSellers = await products.CountAsync(bestSeller: true);
        var totalDownloads = await analytics.CountDownloadsAsync();
        var todayDownloads = await analytics.CountDownloadsAsync(today, today.AddDays(1));
        var monthlyDownloads = await analytics.CountDownloadsAsync(monthStart);
        var quoteCount = await quotes.CountAsync();
        var pendingQuotes = await quotes.CountAsync("pending");
        var dealerRegs = await dealers.CountAsync();
        var mostDownloaded = await products.FindTopByCounterAsync("downloads_count");
        var mostViewed = await products.FindTopByCounterAsync("views_count");
        var topCats = await analytics.TopCategoriesAsync(1);

        return new
        {
            total_categories = totalCategories,
            total_products = totalProducts,
            visible_products = visibleProducts,
            hidden_products = hiddenProducts,
            featured_products = featuredProducts,
            best_sellers = bestSellers,
            total_downloads = totalDownloads,
            today_downloads = todayDownloads,
            monthly_downloads = monthlyDownloads,
            quote_requests = quoteCount,
            pending_requests = pendingQuotes,
            dealer_registrations = dealerRegs,
            most_downloaded_product = mostDownloaded is null ? null : BsonMapper.ToDict(mostDownloaded),
            most_viewed_product = mostViewed is null ? null : BsonMapper.ToDict(mostViewed),
            top_category = topCats.Count > 0 ? new { id = topCats[0].Id, name = topCats[0].Name, count = topCats[0].Count } : null,
            downloads_series = (await analytics.SeriesAsync("download", 14)).Select(x => new { date = x.Date, count = x.Count }),
            views_series = (await analytics.SeriesAsync("view", 14)).Select(x => new { date = x.Date, count = x.Count }),
            quotes_series = (await analytics.SeriesAsync("quote", 14)).Select(x => new { date = x.Date, count = x.Count }),
            top_categories = (await analytics.TopCategoriesAsync(8)).Select(x => new { id = x.Id, name = x.Name, count = x.Count }),
            top_products = (await analytics.TopProductsAsync("download", 8)).Select(x => new { id = x.Id, name = x.Name, count = x.Count }),
        };
    }

    public async Task<object> GetAnalyticsAsync()
    {
        var views = await analytics.CountEventsAsync("view");
        var downloads = await analytics.CountEventsAsync("download");
        var quoteEvents = await analytics.CountEventsAsync("quote");
        var shares = await analytics.CountEventsAsync("share");
        var conversion = views > 0 ? Math.Round(100.0 * quoteEvents / views, 2) : 0;
        var downloadConversion = views > 0 ? Math.Round(100.0 * downloads / views, 2) : 0;

        return new
        {
            views,
            downloads,
            quotes = quoteEvents,
            shares,
            quote_conversion_rate = conversion,
            download_conversion_rate = downloadConversion,
            downloads_series = (await analytics.SeriesAsync("download", 30)).Select(x => new { date = x.Date, count = x.Count }),
            views_series = (await analytics.SeriesAsync("view", 30)).Select(x => new { date = x.Date, count = x.Count }),
            quotes_series = (await analytics.SeriesAsync("quote", 30)).Select(x => new { date = x.Date, count = x.Count }),
            top_categories = (await analytics.TopCategoriesAsync(10)).Select(x => new { id = x.Id, name = x.Name, count = x.Count }),
            top_products = (await analytics.TopProductsAsync("view", 10)).Select(x => new { id = x.Id, name = x.Name, count = x.Count }),
            most_downloaded = (await analytics.TopProductsAsync("download", 10)).Select(x => new { id = x.Id, name = x.Name, count = x.Count }),
            most_shared = (await analytics.TopProductsAsync("share", 10)).Select(x => new { id = x.Id, name = x.Name, count = x.Count }),
            devices = (await analytics.DeviceBreakdownAsync()).Select(x => new { device = x.Device, count = x.Count }),
            countries = (await analytics.CountryBreakdownAsync()).Select(x => new { country = x.Country, count = x.Count }),
        };
    }

    public async Task<object> ListCategoriesAsync(bool includeArchived = false, bool tree = true)
    {
        var items = await categories.ListAsync(includeArchived);
        var dicts = items.Select(BsonMapper.ToDict).ToList();
        if (!tree) return new { items = dicts, total = dicts.Count };

        var byParent = dicts.GroupBy(c => c.GetValueOrDefault("parent_id")?.ToString() ?? "")
            .ToDictionary(g => g.Key, g => g.ToList());

        List<object> Build(string? parentId)
        {
            var key = parentId ?? "";
            if (!byParent.TryGetValue(key, out var kids)) return [];
            return kids.Select(c =>
            {
                var id = c["id"]?.ToString() ?? "";
                return (object)new Dictionary<string, object?>(c)
                {
                    ["children"] = Build(id)
                };
            }).ToList();
        }

        var roots = Build(null);
        // Also attach orphans whose parent is missing
        foreach (var (pid, list) in byParent)
        {
            if (pid == "" || items.Any(i => i.Id == pid)) continue;
            roots.AddRange(list.Select(c =>
            {
                var id = c["id"]?.ToString() ?? "";
                return (object)new Dictionary<string, object?>(c) { ["children"] = Build(id) };
            }));
        }

        return new { items = roots, total = items.Count, flat = dicts };
    }

    public async Task<Dictionary<string, object?>> GetCategoryAsync(string idOrSlug)
    {
        var c = await categories.FindByIdAsync(idOrSlug) ?? await categories.FindBySlugAsync(idOrSlug)
            ?? throw new KeyNotFoundException("Category not found");
        return BsonMapper.ToDict(c);
    }

    public async Task<Dictionary<string, object?>> CreateCategoryAsync(User user, B2bCategoryRequest request)
    {
        var slug = string.IsNullOrWhiteSpace(request.Slug) ? IdHelper.Slugify(request.Name) : IdHelper.Slugify(request.Slug);
        if (await categories.FindBySlugAsync(slug) is not null)
            slug = $"{slug}-{IdHelper.NewId()[..6]}";

        var entity = new B2bCategory
        {
            Id = IdHelper.NewId(),
            Name = request.Name.Trim(),
            Slug = slug,
            ParentId = string.IsNullOrWhiteSpace(request.ParentId) ? null : request.ParentId,
            ShortDescription = request.ShortDescription,
            LongDescription = request.LongDescription,
            Banner = request.Banner,
            CoverImage = request.CoverImage,
            Icon = request.Icon,
            SeoTitle = request.SeoTitle,
            SeoDescription = request.SeoDescription,
            Status = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status,
            DisplayOrder = request.DisplayOrder,
            Featured = request.Featured,
            Visibility = string.IsNullOrWhiteSpace(request.Visibility) ? "visible" : request.Visibility,
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso(),
        };
        await categories.InsertAsync(entity);
        await activity.LogAsync(user, "b2b.category.create", entity.Id, new() { ["name"] = entity.Name });
        await NotifyAdminsAsync("B2B Category Created", $"{entity.Name} was added to the B2B catalog.", "b2b_category");
        return BsonMapper.ToDict(entity);
    }

    public async Task<Dictionary<string, object?>> UpdateCategoryAsync(User user, string id, Dictionary<string, object?> payload)
    {
        var existing = await categories.FindByIdAsync(id) ?? throw new KeyNotFoundException("Category not found");
        var cleaned = SanitizePatch(payload, CategoryImmutable);
        if (cleaned.TryGetValue("slug", out var slugObj) && slugObj is string s && !string.IsNullOrWhiteSpace(s))
        {
            var slug = IdHelper.Slugify(s);
            var clash = await categories.FindBySlugAsync(slug);
            if (clash is not null && clash.Id != id) throw new InvalidOperationException("Slug already in use");
            cleaned["slug"] = slug;
        }
        await categories.UpdateAsync(id, cleaned);
        var updated = await categories.FindByIdAsync(id) ?? existing;
        await activity.LogAsync(user, "b2b.category.update", id, new() { ["name"] = updated.Name });
        return BsonMapper.ToDict(updated);
    }

    public async Task DeleteCategoryAsync(User user, string id)
    {
        _ = await categories.FindByIdAsync(id) ?? throw new KeyNotFoundException("Category not found");
        await categories.DeleteAsync(id);
        await activity.LogAsync(user, "b2b.category.delete", id);
    }

    public async Task<object> DuplicateCategoryAsync(User user, string id)
    {
        var src = await categories.FindByIdAsync(id) ?? throw new KeyNotFoundException("Category not found");
        var copy = new B2bCategoryRequest
        {
            Name = src.Name + " (Copy)",
            ParentId = src.ParentId,
            ShortDescription = src.ShortDescription,
            LongDescription = src.LongDescription,
            Banner = src.Banner,
            CoverImage = src.CoverImage,
            Icon = src.Icon,
            SeoTitle = src.SeoTitle,
            SeoDescription = src.SeoDescription,
            Status = "active",
            DisplayOrder = src.DisplayOrder + 1,
            Featured = false,
            Visibility = src.Visibility,
        };
        return await CreateCategoryAsync(user, copy);
    }

    public async Task ReorderCategoriesAsync(User user, List<Dictionary<string, object?>> items)
    {
        var pairs = items
            .Select(i => (
                Id: i.GetValueOrDefault("id")?.ToString() ?? "",
                Order: Convert.ToInt32(PostgresPayloadNormalizer.Unwrap(i.GetValueOrDefault("display_order")) ?? 0)))
            .Where(x => !string.IsNullOrWhiteSpace(x.Id))
            .ToList();
        await categories.ReorderAsync(pairs);
        await activity.LogAsync(user, "b2b.category.reorder", "bulk", new() { ["count"] = pairs.Count });
    }

    public async Task<object> ListProductsAsync(
        string? categoryId, string? q, string? material, string? color,
        double? minPrice, double? maxPrice, int? maxMoq,
        bool? featured, bool? bestSeller, bool? newArrival, bool? customization,
        string? status, bool? visibleOnly, string? sort, int limit, int skip)
    {
        var (items, total) = await products.ListAsync(new B2bProductQuery(
            CategoryId: categoryId, Query: q, Material: material, Color: color,
            MinPrice: minPrice, MaxPrice: maxPrice, MaxMoq: maxMoq,
            Featured: featured, BestSeller: bestSeller, NewArrival: newArrival, Customization: customization,
            Status: status, VisibleOnly: visibleOnly, Sort: sort, Limit: limit, Skip: skip));
        return new { items = items.Select(BsonMapper.ToDict).ToList(), total };
    }

    public async Task<object> GetProductAsync(string slugOrId, bool trackView = false)
    {
        var p = await products.FindBySlugOrIdAsync(slugOrId) ?? throw new KeyNotFoundException("Product not found");
        if (trackView)
        {
            await products.IncrementCounterAsync(p.Id, "views_count");
            await analytics.InsertAsync(new B2bAnalyticsEvent
            {
                Id = IdHelper.NewId(),
                EventType = "view",
                ProductId = p.Id,
                CategoryId = p.CategoryId,
                CreatedAt = IdHelper.NowIso(),
            });
            p = await products.FindByIdAsync(p.Id) ?? p;
        }
        var related = await products.FindRelatedAsync(p.CategoryId, p.Id);
        B2bCategory? category = null;
        if (!string.IsNullOrWhiteSpace(p.CategoryId))
            category = await categories.FindByIdAsync(p.CategoryId);
        return new
        {
            product = BsonMapper.ToDict(p),
            category = category is null ? null : BsonMapper.ToDict(category),
            related = related.Select(BsonMapper.ToDict).ToList(),
        };
    }

    public async Task<Dictionary<string, object?>> CreateProductAsync(User user, B2bProductRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Product name is required");

        var slug = string.IsNullOrWhiteSpace(request.Slug) ? IdHelper.Slugify(request.Name) : IdHelper.Slugify(request.Slug);
        if (await products.FindBySlugAsync(slug) is not null)
            slug = $"{slug}-{IdHelper.NewId()[..6]}";

        var entity = MapProductRequest(request, IdHelper.NewId(), slug);
        await products.InsertAsync(entity);
        await activity.LogAsync(user, "b2b.product.create", entity.Id, new() { ["name"] = entity.Name });
        await NotifyAdminsAsync("New B2B Product", $"{entity.Name} was created.", "b2b_product");
        return BsonMapper.ToDict(entity);
    }

    public async Task<Dictionary<string, object?>> UpdateProductAsync(User user, string id, Dictionary<string, object?> payload)
    {
        var existing = await products.FindByIdAsync(id) ?? throw new KeyNotFoundException("Product not found");
        var cleaned = SanitizePatch(payload, ProductImmutable);
        if (cleaned.TryGetValue("slug", out var slugObj) && slugObj is string s)
        {
            if (string.IsNullOrWhiteSpace(s)) cleaned.Remove("slug");
            else
            {
                var slug = IdHelper.Slugify(s);
                var clash = await products.FindBySlugAsync(slug);
                if (clash is not null && clash.Id != id) throw new InvalidOperationException("Slug already in use");
                cleaned["slug"] = slug;
            }
        }

        var wasVisible = existing.IsVisible;
        await products.UpdateAsync(id, cleaned);
        var updated = await products.FindByIdAsync(id) ?? existing;
        if (wasVisible && !updated.IsVisible)
            await NotifyAdminsAsync("B2B Product Hidden", $"{updated.Name} was hidden from the catalog.", "b2b_product_hidden");
        await activity.LogAsync(user, "b2b.product.update", id, new() { ["name"] = updated.Name });
        return BsonMapper.ToDict(updated);
    }

    public async Task DeleteProductAsync(User user, string id)
    {
        _ = await products.FindByIdAsync(id) ?? throw new KeyNotFoundException("Product not found");
        await products.DeleteAsync(id);
        await activity.LogAsync(user, "b2b.product.delete", id);
    }

    public async Task<object> DuplicateProductAsync(User user, string id)
    {
        var src = await products.FindByIdAsync(id) ?? throw new KeyNotFoundException("Product not found");
        var req = new B2bProductRequest
        {
            Name = src.Name + " (Copy)",
            Sku = string.IsNullOrWhiteSpace(src.Sku) ? "" : src.Sku + "-COPY",
            CategoryId = src.CategoryId,
            SubcategoryId = src.SubcategoryId,
            Brand = src.Brand,
            Status = "draft",
            Featured = false,
            BestSeller = src.BestSeller,
            NewArrival = src.NewArrival,
            RetailPrice = src.RetailPrice,
            WholesalePrice = src.WholesalePrice,
            DealerPrice = src.DealerPrice,
            MinOrderQty = src.MinOrderQty,
            RecommendedMoq = src.RecommendedMoq,
            GstPercent = src.GstPercent,
            DiscountPercent = src.DiscountPercent,
            OfferPrice = src.OfferPrice,
            Material = src.Material,
            Printer = src.Printer,
            PrintingTechnology = src.PrintingTechnology,
            LayerHeight = src.LayerHeight,
            NozzleSize = src.NozzleSize,
            Infill = src.Infill,
            WeightG = src.WeightG,
            Dimensions = src.Dimensions,
            ProductionTime = src.ProductionTime,
            LeadTime = src.LeadTime,
            Packaging = src.Packaging,
            CountryOfOrigin = src.CountryOfOrigin,
            Colors = src.Colors,
            Customization = src.Customization,
            HeroImage = src.HeroImage,
            Gallery = src.Gallery,
            LifestyleImages = src.LifestyleImages,
            WhiteBgImages = src.WhiteBgImages,
            TransparentImages = src.TransparentImages,
            Images360 = src.Images360,
            Videos = src.Videos,
            Overview = src.Overview,
            Features = src.Features,
            Applications = src.Applications,
            Benefits = src.Benefits,
            Specifications = src.Specifications,
            PackageContents = src.PackageContents,
            CareInstructions = src.CareInstructions,
            Faqs = src.Faqs,
            IsVisible = false,
            IsDownloadable = src.IsDownloadable,
            ShowPrice = src.ShowPrice,
            ShowMoq = src.ShowMoq,
            ShowLeadTime = src.ShowLeadTime,
            Recommended = src.Recommended,
            ComingSoon = src.ComingSoon,
            SeoTitle = src.SeoTitle,
            SeoDescription = src.SeoDescription,
            SeoKeywords = src.SeoKeywords,
        };
        return await CreateProductAsync(user, req);
    }

    public async Task<object> GetCatalogExportAsync(B2bCatalogExportRequest request)
    {
        List<B2bProduct> items;
        switch ((request.Mode ?? "complete").ToLowerInvariant())
        {
            case "single":
            case "selection":
                items = await products.FindByIdsAsync(request.ProductIds ?? []);
                break;
            case "category":
                var (catItems, _) = await products.ListAsync(new B2bProductQuery(
                    CategoryId: request.CategoryId, Status: "published", VisibleOnly: true, Limit: 5000));
                items = catItems;
                break;
            case "featured":
                var (feat, _) = await products.ListAsync(new B2bProductQuery(
                    Featured: true, Status: "published", VisibleOnly: true, Limit: 5000));
                items = feat;
                break;
            default:
                var (all, _) = await products.ListAsync(new B2bProductQuery(
                    Status: "published", VisibleOnly: true, Limit: 5000));
                items = all;
                break;
        }

        var settingsRow = await settings.GetAsync();
        foreach (var p in items)
        {
            await products.IncrementCounterAsync(p.Id, "downloads_count");
            await analytics.InsertAsync(new B2bAnalyticsEvent
            {
                Id = IdHelper.NewId(),
                EventType = "download",
                ProductId = p.Id,
                CategoryId = p.CategoryId,
                Metadata = new() { ["mode"] = request.Mode, ["template"] = request.Template },
                CreatedAt = IdHelper.NowIso(),
            });
        }

        return new
        {
            template = string.IsNullOrWhiteSpace(request.Template) ? settingsRow.DefaultPdfTemplate : request.Template,
            settings = BsonMapper.ToDict(settingsRow),
            products = items.Select(BsonMapper.ToDict).ToList(),
            generated_at = IdHelper.NowIso(),
            mode = request.Mode,
        };
    }

    public async Task<object> ListQuotesAsync(string? status, int limit, int skip)
    {
        var (items, total) = await quotes.ListAsync(status, limit, skip);
        return new { items = items.Select(BsonMapper.ToDict).ToList(), total };
    }

    public async Task<Dictionary<string, object?>> CreateQuoteAsync(B2bQuoteRequestDto request)
    {
        string productName = request.ProductName;
        if (!string.IsNullOrWhiteSpace(request.ProductId))
        {
            var p = await products.FindByIdAsync(request.ProductId);
            if (p is not null)
            {
                productName = string.IsNullOrWhiteSpace(productName) ? p.Name : productName;
                await products.IncrementCounterAsync(p.Id, "quote_requests_count");
                await analytics.InsertAsync(new B2bAnalyticsEvent
                {
                    Id = IdHelper.NewId(),
                    EventType = "quote",
                    ProductId = p.Id,
                    CategoryId = p.CategoryId,
                    CreatedAt = IdHelper.NowIso(),
                });
            }
        }

        var entity = new B2bQuoteRequest
        {
            Id = IdHelper.NewId(),
            BusinessName = request.BusinessName.Trim(),
            OwnerName = request.OwnerName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Gst = request.Gst,
            Address = request.Address,
            ProductId = request.ProductId,
            ProductName = productName,
            Quantity = Math.Max(1, request.Quantity),
            Customization = request.Customization,
            Message = request.Message,
            Status = "pending",
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso(),
        };
        await quotes.InsertAsync(entity);
        await NotifyAdminsAsync("New B2B Quote Request", $"{entity.BusinessName} requested a quote for {entity.ProductName}.", "b2b_quote");
        return BsonMapper.ToDict(entity);
    }

    public async Task<Dictionary<string, object?>> UpdateQuoteAsync(User user, string id, Dictionary<string, object?> payload)
    {
        _ = await quotes.FindByIdAsync(id) ?? throw new KeyNotFoundException("Quote not found");
        var cleaned = SanitizePatch(payload, new HashSet<string>(StringComparer.Ordinal) { "id", "created_at" });
        await quotes.UpdateAsync(id, cleaned);
        var updated = await quotes.FindByIdAsync(id)!;
        await activity.LogAsync(user, "b2b.quote.update", id);
        return BsonMapper.ToDict(updated!);
    }

    public async Task DeleteQuoteAsync(User user, string id)
    {
        _ = await quotes.FindByIdAsync(id) ?? throw new KeyNotFoundException("Quote not found");
        await quotes.DeleteAsync(id);
        await activity.LogAsync(user, "b2b.quote.delete", id);
    }

    public async Task<object> ListDealersAsync(string? status, int limit, int skip)
    {
        var (items, total) = await dealers.ListAsync(status, limit, skip);
        return new { items = items.Select(BsonMapper.ToDict).ToList(), total };
    }

    public async Task<Dictionary<string, object?>> CreateDealerAsync(B2bDealerRequest request)
    {
        var entity = new B2bDealer
        {
            Id = IdHelper.NewId(),
            CompanyName = request.CompanyName.Trim(),
            OwnerName = request.OwnerName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Gst = request.Gst,
            Address = request.Address,
            BusinessType = request.BusinessType,
            Categories = request.Categories ?? [],
            MonthlyPurchaseVolume = request.MonthlyPurchaseVolume,
            Status = "pending",
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso(),
        };
        await dealers.InsertAsync(entity);
        await analytics.InsertAsync(new B2bAnalyticsEvent
        {
            Id = IdHelper.NewId(),
            EventType = "dealer_registration",
            Metadata = new() { ["company"] = entity.CompanyName },
            CreatedAt = IdHelper.NowIso(),
        });
        await NotifyAdminsAsync("New Dealer Registration", $"{entity.CompanyName} applied to become a dealer.", "b2b_dealer");
        return BsonMapper.ToDict(entity);
    }

    public async Task<Dictionary<string, object?>> UpdateDealerAsync(User user, string id, Dictionary<string, object?> payload)
    {
        _ = await dealers.FindByIdAsync(id) ?? throw new KeyNotFoundException("Dealer not found");
        var cleaned = SanitizePatch(payload, new HashSet<string>(StringComparer.Ordinal) { "id", "created_at" });
        await dealers.UpdateAsync(id, cleaned);
        var updated = await dealers.FindByIdAsync(id)!;
        await activity.LogAsync(user, "b2b.dealer.update", id);
        return BsonMapper.ToDict(updated!);
    }

    public async Task DeleteDealerAsync(User user, string id)
    {
        _ = await dealers.FindByIdAsync(id) ?? throw new KeyNotFoundException("Dealer not found");
        await dealers.DeleteAsync(id);
        await activity.LogAsync(user, "b2b.dealer.delete", id);
    }

    public async Task TrackEventAsync(B2bAnalyticsTrackRequest request, string? ipHash = null)
    {
        var type = (request.EventType ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(type)) throw new InvalidOperationException("event_type is required");

        await analytics.InsertAsync(new B2bAnalyticsEvent
        {
            Id = IdHelper.NewId(),
            EventType = type,
            ProductId = request.ProductId,
            CategoryId = request.CategoryId,
            Metadata = request.Metadata ?? new(),
            Device = request.Device,
            Country = request.Country,
            IpHash = ipHash ?? "",
            CreatedAt = IdHelper.NowIso(),
        });

        if (!string.IsNullOrWhiteSpace(request.ProductId))
        {
            var col = type switch
            {
                "download" => "downloads_count",
                "share" => "shares_count",
                "whatsapp" => "whatsapp_clicks_count",
                "view" => "views_count",
                "quote" => "quote_requests_count",
                _ => null
            };
            if (col is not null)
                await products.IncrementCounterAsync(request.ProductId, col);
        }

        if (type == "download")
            await NotifyAdminsAsync("Catalog Download", "A B2B catalog download was recorded.", "b2b_download");
    }

    public async Task<Dictionary<string, object?>> GetSettingsAsync() =>
        BsonMapper.ToDict(await settings.GetAsync());

    public async Task<Dictionary<string, object?>> UpdateSettingsAsync(User user, B2bSettingsRequest request)
    {
        var updates = new Dictionary<string, object?>();
        if (request.CompanyName is not null) updates["company_name"] = request.CompanyName;
        if (request.Tagline is not null) updates["tagline"] = request.Tagline;
        if (request.WhatsappNumber is not null) updates["whatsapp_number"] = request.WhatsappNumber;
        if (request.SalesEmail is not null) updates["sales_email"] = request.SalesEmail;
        if (request.SalesPhone is not null) updates["sales_phone"] = request.SalesPhone;
        if (request.CatalogCoverTitle is not null) updates["catalog_cover_title"] = request.CatalogCoverTitle;
        if (request.DefaultPdfTemplate is not null) updates["default_pdf_template"] = request.DefaultPdfTemplate;
        if (request.ShowDealerPricePublic.HasValue) updates["show_dealer_price_public"] = request.ShowDealerPricePublic.Value;
        if (request.HeroImage is not null) updates["hero_image"] = request.HeroImage;
        await settings.UpdateAsync(updates);
        await activity.LogAsync(user, "b2b.settings.update", "default");
        return await GetSettingsAsync();
    }

    private static B2bProduct MapProductRequest(B2bProductRequest request, string id, string slug) => new()
    {
        Id = id,
        Name = request.Name.Trim(),
        Sku = request.Sku?.Trim() ?? "",
        Slug = slug,
        CategoryId = string.IsNullOrWhiteSpace(request.CategoryId) ? null : request.CategoryId,
        SubcategoryId = string.IsNullOrWhiteSpace(request.SubcategoryId) ? null : request.SubcategoryId,
        Brand = request.Brand ?? "",
        Status = string.IsNullOrWhiteSpace(request.Status) ? "draft" : request.Status,
        Featured = request.Featured,
        BestSeller = request.BestSeller,
        NewArrival = request.NewArrival,
        RetailPrice = request.RetailPrice,
        WholesalePrice = request.WholesalePrice,
        DealerPrice = request.DealerPrice,
        MinOrderQty = Math.Max(1, request.MinOrderQty),
        RecommendedMoq = Math.Max(1, request.RecommendedMoq),
        GstPercent = request.GstPercent,
        DiscountPercent = request.DiscountPercent,
        OfferPrice = request.OfferPrice,
        Material = request.Material ?? "",
        Printer = request.Printer ?? "",
        PrintingTechnology = request.PrintingTechnology ?? "",
        LayerHeight = request.LayerHeight ?? "",
        NozzleSize = request.NozzleSize ?? "",
        Infill = request.Infill ?? "",
        WeightG = request.WeightG,
        Dimensions = request.Dimensions,
        ProductionTime = request.ProductionTime ?? "",
        LeadTime = request.LeadTime ?? "",
        Packaging = request.Packaging ?? "",
        CountryOfOrigin = string.IsNullOrWhiteSpace(request.CountryOfOrigin) ? "India" : request.CountryOfOrigin,
        Colors = request.Colors ?? [],
        Customization = request.Customization ?? new(),
        HeroImage = request.HeroImage ?? "",
        Gallery = request.Gallery ?? [],
        LifestyleImages = request.LifestyleImages ?? [],
        WhiteBgImages = request.WhiteBgImages ?? [],
        TransparentImages = request.TransparentImages ?? [],
        Images360 = request.Images360 ?? [],
        Videos = request.Videos ?? [],
        Overview = request.Overview ?? "",
        Features = request.Features ?? "",
        Applications = request.Applications ?? "",
        Benefits = request.Benefits ?? "",
        Specifications = request.Specifications ?? "",
        PackageContents = request.PackageContents ?? "",
        CareInstructions = request.CareInstructions ?? "",
        Faqs = request.Faqs ?? [],
        IsVisible = request.IsVisible,
        IsDownloadable = request.IsDownloadable,
        ShowPrice = request.ShowPrice,
        ShowMoq = request.ShowMoq,
        ShowLeadTime = request.ShowLeadTime,
        Recommended = request.Recommended,
        ComingSoon = request.ComingSoon,
        SeoTitle = request.SeoTitle,
        SeoDescription = request.SeoDescription,
        SeoKeywords = request.SeoKeywords,
        OgImage = request.OgImage,
        TwitterCard = request.TwitterCard,
        CanonicalUrl = request.CanonicalUrl,
        CreatedAt = IdHelper.NowIso(),
        UpdatedAt = IdHelper.NowIso(),
    };

    private static Dictionary<string, object?> SanitizePatch(Dictionary<string, object?> payload, HashSet<string> immutable)
    {
        var cleaned = new Dictionary<string, object?>(StringComparer.Ordinal);
        foreach (var (key, raw) in payload)
        {
            if (immutable.Contains(key)) continue;
            var value = PostgresPayloadNormalizer.Unwrap(raw);
            if (B2bJsonFields.Contains(key) && value is not null and not string)
                value = JsonSerializer.Deserialize<object>(JsonSerializer.Serialize(value));
            cleaned[key] = value;
        }
        return cleaned;
    }

    private async Task NotifyAdminsAsync(string title, string body, string type)
    {
        // Notifications table uses user_id — store system broadcast for admin role via empty-user sentinel.
        await notifications.InsertAsync(new Notification
        {
            Id = IdHelper.NewId(),
            UserId = "admin",
            Title = title,
            Message = body,
            Kind = type,
            Read = false,
            CreatedAt = IdHelper.NowIso(),
        });
    }
}

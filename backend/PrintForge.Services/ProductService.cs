using System.Text;
using PrintForge.Constants;
using PrintForge.Infrastructure.Database;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

public class ProductService(
    IProductRepository products,
    IReviewRepository reviews,
    IActivityLogService activity) : IProductService
{
    public async Task<object> ListAsync(string? category, string? q, string? material, double? minPrice, double? maxPrice, bool? featured, string? sort, int limit, int skip)
    {
        var (items, total) = await products.ListAsync(new ProductQuery(category, q, material, minPrice, maxPrice, featured, sort, limit, skip));
        return new
        {
            items = items.Select(BsonMapper.ToDict).ToList(),
            total
        };
    }

    public async Task<object> GetBySlugAsync(string slug)
    {
        var p = await products.FindBySlugOrIdAsync(slug)
            ?? throw new KeyNotFoundException("Product not found");

        var revs = await reviews.FindByProductAsync(p.Id);
        var related = await products.FindRelatedAsync(p.CategorySlug, p.Id);
        return new
        {
            product = BsonMapper.ToDict(p),
            reviews = revs.Select(BsonMapper.ToDict).ToList(),
            related = related.Select(BsonMapper.ToDict).ToList()
        };
    }

    public async Task<Dictionary<string, object?>> CreateAsync(User user, ProductRequest request)
    {
        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? IdHelper.Slugify(request.Name)
            : request.Slug.Trim();
        if (await products.FindBySlugAsync(slug) is not null)
            slug = $"{slug}-{IdHelper.NewId()[..6]}";

        var product = new Product
        {
            Id = IdHelper.NewId(),
            Name = request.Name,
            Slug = slug,
            Description = request.Description,
            ShortDescription = request.ShortDescription,
            CategorySlug = request.CategorySlug,
            Price = request.Price,
            DiscountPrice = request.DiscountPrice,
            Stock = request.Stock,
            Material = request.Material,
            WeightG = request.WeightG,
            Dimensions = request.Dimensions,
            PrintTimeHours = request.PrintTimeHours,
            ColorVariants = request.ColorVariants,
            Colors = request.Colors,
            HeroImage = request.HeroImage ?? request.Images.FirstOrDefault() ?? "",
            Images = request.Images,
            Tags = request.Tags,
            Featured = request.Featured,
            IsActive = request.IsActive,
            SeoTitle = request.SeoTitle,
            SeoDescription = request.SeoDescription,
            RatingAvg = 0,
            RatingCount = 0,
            OrdersCount = 0,
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso()
        };
        await products.InsertAsync(product);
        await activity.LogAsync(user, "product.create", product.Id, new Dictionary<string, object?> { ["name"] = product.Name });
        return BsonMapper.ToDict(product);
    }

    public async Task<Dictionary<string, object?>> UpdateAsync(User user, string pid, Dictionary<string, object?> payload)
    {
        payload = PostgresPayloadNormalizer.SanitizeProductPatch(payload);

        if (payload.TryGetValue("slug", out var slugObj)
            && slugObj is string slugStr
            && string.IsNullOrWhiteSpace(slugStr))
        {
            payload.Remove("slug");
        }

        var existing = await products.FindByIdAsync(pid);
        if (existing is not null && string.IsNullOrWhiteSpace(existing.Slug) && !payload.ContainsKey("slug"))
            payload["slug"] = IdHelper.Slugify(existing.Name);

        payload["updated_at"] = IdHelper.NowIso();
        await products.UpdateAsync(pid, payload);
        var p = await products.FindByIdAsync(pid) ?? throw new KeyNotFoundException("Not found");
        await activity.LogAsync(user, "product.update", pid, new Dictionary<string, object?> { ["name"] = p.Name });
        return BsonMapper.ToDict(p);
    }

    public async Task DeleteAsync(User user, string pid)
    {
        var p = await products.FindByIdAsync(pid);
        await products.DeleteAsync(pid);
        await activity.LogAsync(user, "product.delete", pid, new Dictionary<string, object?> { ["name"] = p?.Name });
    }

    public async Task<(byte[] Data, string Filename)> ExportCsvAsync()
    {
        var items = await products.ListAllAsync();
        using var writer = new StringWriter();
        writer.WriteLine(string.Join(",", BackendConstants.ProductCsvFields));

        foreach (var p in items)
        {
            var dict = BsonMapper.ToDict(p);
            var fields = BackendConstants.ProductCsvFields.Select(field =>
            {
                if (!dict.TryGetValue(field, out var val) || val is null) return "";
                if (val is List<object?> list) return string.Join("|", list.Select(x => x?.ToString() ?? ""));
                return val.ToString()?.Replace(",", " ") ?? "";
            });
            writer.WriteLine(string.Join(",", fields));
        }

        var filename = $"newjourney-products-{DateTime.UtcNow:yyyyMMdd-HHmm}.csv";
        return (Encoding.UTF8.GetBytes(writer.ToString()), filename);
    }

    /// <summary>Blank import template with header row and one example product.</summary>
    public Task<(byte[] Data, string Filename)> ExportTemplateAsync()
    {
        using var writer = new StringWriter();
        writer.WriteLine(string.Join(",", BackendConstants.ProductCsvFields));
        writer.WriteLine(string.Join(",",
            "Sample Figurine", "sample-figurine", "accessories", "PLA", "499", "399", "10",
            "50", "10x10x5 cm", "2", "Black|White", "", "gift|miniature", "false", "true",
            "A sample product", "Full description here.", "Sample Figurine", "SEO description"));
        var filename = "newjourney-product-import-template.csv";
        return Task.FromResult((Encoding.UTF8.GetBytes(writer.ToString()), filename));
    }

    public async Task<ImportProductsResponse> ImportCsvAsync(User user, Stream csvStream)
    {
        using var reader = new StreamReader(csvStream, Encoding.UTF8);
        var headerLine = await reader.ReadLineAsync();
        if (string.IsNullOrEmpty(headerLine))
            return new ImportProductsResponse();

        var headers = headerLine.Split(',').Select(h => h.Trim().Trim('"')).ToList();
        var rows = new List<Dictionary<string, string>>();
        var rowNum = 1;
        string? line;

        while ((line = await reader.ReadLineAsync()) is not null)
        {
            rowNum++;
            var values = ParseCsvLine(line);
            var row = new Dictionary<string, string>();
            for (var i = 0; i < headers.Count && i < values.Count; i++)
                row[headers[i]] = values[i];
            rows.Add(row);
        }

        var result = await ImportRowsAsync(user, rows);
        return result;
    }

    public async Task<ImportProductsResponse> ImportRowsAsync(User user, IReadOnlyList<Dictionary<string, string>> rows)
    {
        var created = 0;
        var updated = 0;
        var errors = new List<Dictionary<string, object?>>();
        var rowNum = 1;

        foreach (var row in rows)
        {
            rowNum++;
            try
            {
                string Get(string k) => row.TryGetValue(k, out var v) ? v.Trim() : "";

                var name = Get("name");
                if (string.IsNullOrEmpty(name))
                {
                    errors.Add(new Dictionary<string, object?> { ["row"] = rowNum, ["error"] = "missing name" });
                    continue;
                }

                var slug = Get("slug");
                if (string.IsNullOrEmpty(slug)) slug = IdHelper.Slugify(name);
                var existing = await products.FindBySlugAsync(slug);

                var payload = BuildProductPayload(row, name, slug);

                if (existing is not null)
                {
                    await products.UpdateAsync(existing.Id, payload);
                    updated++;
                }
                else
                {
                    payload["id"] = IdHelper.NewId();
                    payload["rating_avg"] = 0.0;
                    payload["rating_count"] = 0;
                    payload["orders_count"] = 0;
                    payload["created_at"] = IdHelper.NowIso();
                    await products.InsertAsync(MapProduct(payload));
                    created++;
                }
            }
            catch (Exception ex)
            {
                errors.Add(new Dictionary<string, object?> { ["row"] = rowNum, ["error"] = ex.Message });
            }
        }

        await activity.LogAsync(user, "products.import", "bulk", new Dictionary<string, object?>
        {
            ["created"] = created, ["updated"] = updated, ["errors"] = errors.Count
        });

        return new ImportProductsResponse { Created = created, Updated = updated, Errors = errors };
    }

    private static Dictionary<string, object?> BuildProductPayload(Dictionary<string, string> row, string name, string slug)
    {
        string Get(string k) => row.TryGetValue(k, out var v) ? v.Trim() : "";

        return new Dictionary<string, object?>
        {
            ["name"] = name,
            ["slug"] = slug,
            ["category_slug"] = string.IsNullOrEmpty(Get("category_slug")) ? "accessories" : Get("category_slug"),
            ["material"] = string.IsNullOrEmpty(Get("material")) ? "PLA" : Get("material"),
            ["price"] = CoerceDouble(Get("price")) ?? 0,
            ["discount_price"] = CoerceDouble(Get("discount_price")),
            ["stock"] = CoerceInt(Get("stock")) ?? 0,
            ["weight_g"] = CoerceDouble(Get("weight_g")),
            ["dimensions"] = string.IsNullOrEmpty(Get("dimensions")) ? null : Get("dimensions"),
            ["print_time_hours"] = CoerceDouble(Get("print_time_hours")),
            ["color_variants"] = CoerceList(Get("color_variants")),
            ["images"] = CoerceList(Get("images")),
            ["tags"] = CoerceList(Get("tags")),
            ["featured"] = CoerceBool(Get("featured")),
            ["is_active"] = string.IsNullOrEmpty(Get("is_active")) ? true : CoerceBool(Get("is_active")),
            ["short_description"] = Get("short_description"),
            ["description"] = Get("description"),
            ["seo_title"] = string.IsNullOrEmpty(Get("seo_title")) ? name : Get("seo_title"),
            ["seo_description"] = Get("seo_description"),
            ["updated_at"] = IdHelper.NowIso()
        };
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;
        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (c == '"') inQuotes = !inQuotes;
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString());
                current.Clear();
            }
            else current.Append(c);
        }
        result.Add(current.ToString());
        return result;
    }

    private static double? CoerceDouble(string? v) =>
        double.TryParse(v, out var d) ? d : null;

    private static int? CoerceInt(string? v) =>
        int.TryParse(v, out var i) ? i : int.TryParse(v?.Split('.')[0], out i) ? i : null;

    private static bool CoerceBool(string? v) =>
        v is not null && new[] { "1", "true", "yes", "y" }.Contains(v.Trim().ToLowerInvariant());

    private static List<string> CoerceList(string? v) =>
        string.IsNullOrEmpty(v) ? [] : v.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    private static Product MapProduct(Dictionary<string, object?> d) => new()
    {
        Id = d["id"]?.ToString() ?? IdHelper.NewId(),
        Name = d["name"]?.ToString() ?? "",
        Slug = d["slug"]?.ToString() ?? "",
        CategorySlug = d["category_slug"]?.ToString() ?? "",
        Material = d["material"]?.ToString() ?? "PLA",
        Price = Convert.ToDouble(d.GetValueOrDefault("price") ?? 0),
        DiscountPrice = d["discount_price"] as double?,
        Stock = Convert.ToInt32(d.GetValueOrDefault("stock") ?? 0),
        WeightG = d["weight_g"] as double?,
        Dimensions = d["dimensions"]?.ToString(),
        PrintTimeHours = d["print_time_hours"] as double?,
        ColorVariants = d["color_variants"] as List<string> ?? [],
        Images = d["images"] as List<string> ?? [],
        Tags = d["tags"] as List<string> ?? [],
        Featured = d["featured"] as bool? ?? false,
        IsActive = d["is_active"] as bool? ?? true,
        ShortDescription = d["short_description"]?.ToString() ?? "",
        Description = d["description"]?.ToString() ?? "",
        SeoTitle = d["seo_title"]?.ToString(),
        SeoDescription = d["seo_description"]?.ToString(),
        RatingAvg = 0,
        RatingCount = 0,
        OrdersCount = 0,
        CreatedAt = d["created_at"]?.ToString() ?? IdHelper.NowIso(),
        UpdatedAt = d["updated_at"]?.ToString() ?? IdHelper.NowIso()
    };
}

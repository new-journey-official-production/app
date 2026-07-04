using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PrintForge.Constants;
using PrintForge.Infrastructure.Auth;
using PrintForge.Infrastructure.Configuration;
using PrintForge.Models;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

/// <summary>Startup seed — categories, products, users, blog, coupons, printers, inventory, RBAC.</summary>
public class SeedDataService(
    IOptions<AppSettings> settings,
    ICategoryRepository categories,
    IUserRepository users,
    IProductRepository products,
    IBlogRepository blog,
    ICouponRepository coupons,
    IPrinterRepository printers,
    IInventoryRepository inventory,
    IPermissionService permissions,
    ILogger<SeedDataService> logger) : ISeedDataService
{
    private static readonly Dictionary<string, object>[] ProductSeed =
    [
        new() { ["name"] = "Modular Spice Rack", ["category_slug"] = "kitchen", ["price"] = 899.0, ["discount_price"] = 749.0, ["material"] = "PLA", ["color_variants"] = new[] { "Black", "White", "Wood Brown" }, ["featured"] = true, ["images"] = new[] { "https://images.unsplash.com/photo-1590794056484-df8a1c3ba53f?w=900" }, ["short_description"] = "Stackable, wall-mountable 3D-printed spice organizer.", ["print_time_hours"] = 6.5, ["weight_g"] = 240.0, ["dimensions"] = "30 × 12 × 8 cm" },
        new() { ["name"] = "Herb Grinder Set", ["category_slug"] = "kitchen", ["price"] = 549.0, ["material"] = "PETG", ["color_variants"] = new[] { "Charcoal", "Ivory" }, ["images"] = new[] { "https://images.unsplash.com/photo-1556909024-f4a256a49a70?w=900" }, ["short_description"] = "Two-part precision herb grinder printed in food-safe PETG.", ["print_time_hours"] = 3.2, ["weight_g"] = 90.0 },
        new() { ["name"] = "Cable Management Loops (×20)", ["category_slug"] = "home-utility", ["price"] = 299.0, ["material"] = "TPU", ["color_variants"] = new[] { "Black" }, ["featured"] = true, ["images"] = new[] { "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=900" }, ["short_description"] = "Flexible TPU cable loops that stick to any surface.", ["print_time_hours"] = 2.5, ["weight_g"] = 45.0 },
        new() { ["name"] = "Under-Shelf Basket", ["category_slug"] = "home-utility", ["price"] = 1099.0, ["material"] = "PLA", ["images"] = new[] { "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=900" }, ["short_description"] = "Slide-under-shelf storage basket with modular clips.", ["print_time_hours"] = 11.0, ["weight_g"] = 380.0 },
        new() { ["name"] = "Ergonomic Laptop Riser", ["category_slug"] = "office", ["price"] = 1499.0, ["discount_price"] = 1249.0, ["material"] = "PETG", ["color_variants"] = new[] { "Graphite" }, ["featured"] = true, ["images"] = new[] { "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=900" }, ["short_description"] = "Angled riser for cooler, healthier posture.", ["print_time_hours"] = 14.0, ["weight_g"] = 620.0 },
        new() { ["name"] = "Desk Cable Tray", ["category_slug"] = "office", ["price"] = 799.0, ["material"] = "PLA", ["images"] = new[] { "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=900" }, ["short_description"] = "Clamp-on tray that hides cables under any desk.", ["print_time_hours"] = 7.0, ["weight_g"] = 260.0 },
        new() { ["name"] = "Anatomy Heart Model", ["category_slug"] = "education", ["price"] = 1899.0, ["material"] = "Resin", ["images"] = new[] { "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=900" }, ["short_description"] = "Life-size anatomical heart cross-section.", ["print_time_hours"] = 18.0, ["weight_g"] = 400.0 },
        new() { ["name"] = "Seedling Starter Cups (×12)", ["category_slug"] = "farming", ["price"] = 399.0, ["material"] = "PLA", ["color_variants"] = new[] { "Terracotta", "Moss Green" }, ["images"] = new[] { "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900" }, ["short_description"] = "Compostable 3D-printed cups for germinating seeds.", ["print_time_hours"] = 4.0, ["weight_g"] = 120.0 },
        new() { ["name"] = "Voronoi Vase — Large", ["category_slug"] = "decoration", ["price"] = 1299.0, ["material"] = "PLA", ["color_variants"] = new[] { "Sand", "Onyx" }, ["featured"] = true, ["images"] = new[] { "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900" }, ["short_description"] = "Organic parametric vase with layered light play.", ["print_time_hours"] = 10.0, ["weight_g"] = 340.0 },
        new() { ["name"] = "Buddha Meditation Statue", ["category_slug"] = "religious", ["price"] = 1499.0, ["material"] = "Resin", ["images"] = new[] { "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900" }, ["short_description"] = "Serene desktop Buddha printed in high-detail resin.", ["print_time_hours"] = 9.0, ["weight_g"] = 220.0 },
        new() { ["name"] = "Phone Dash Mount", ["category_slug"] = "automotive", ["price"] = 649.0, ["material"] = "PETG", ["images"] = new[] { "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900" }, ["short_description"] = "Universal magnetic dash mount, custom-fit brackets on request.", ["print_time_hours"] = 5.0, ["weight_g"] = 130.0 },
        new() { ["name"] = "MagSafe Wallet Stand", ["category_slug"] = "mobile-accessories", ["price"] = 799.0, ["material"] = "PETG", ["featured"] = true, ["images"] = new[] { "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=900" }, ["short_description"] = "Slim card holder + kickstand for MagSafe iPhones.", ["print_time_hours"] = 4.0, ["weight_g"] = 60.0 },
        new() { ["name"] = "Controller Wall Mount (Pair)", ["category_slug"] = "gaming", ["price"] = 899.0, ["material"] = "PLA", ["images"] = new[] { "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900" }, ["short_description"] = "Discreet wall hooks for PS/Xbox controllers.", ["print_time_hours"] = 5.0, ["weight_g"] = 180.0 },
        new() { ["name"] = "Dice Tower — Dungeon Edition", ["category_slug"] = "gaming", ["price"] = 1799.0, ["material"] = "PLA", ["images"] = new[] { "https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?w=900" }, ["short_description"] = "Cinematic dice tower with rolling ramps.", ["print_time_hours"] = 22.0, ["weight_g"] = 540.0 },
        new() { ["name"] = "Personalized Name Plaque", ["category_slug"] = "gifts", ["price"] = 599.0, ["material"] = "PLA", ["images"] = new[] { "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=900" }, ["short_description"] = "Custom typography name plaque — pick font + color.", ["print_time_hours"] = 3.0, ["weight_g"] = 100.0 },
        new() { ["name"] = "Send Us Your STL — Custom Print", ["category_slug"] = "custom-prints", ["price"] = 199.0, ["material"] = "PLA", ["featured"] = true, ["images"] = new[] { "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=900" }, ["short_description"] = "Upload your STL — we'll price + print. Per-gram base rate.", ["print_time_hours"] = 0.0 },
        new() { ["name"] = "Filament Spool Holder", ["category_slug"] = "accessories", ["price"] = 449.0, ["material"] = "PLA", ["images"] = new[] { "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=900" }, ["short_description"] = "Universal roller-bearing spool holder for any printer.", ["print_time_hours"] = 6.0, ["weight_g"] = 200.0 }
    ];

    public async Task SeedAsync()
    {
        if (await categories.CountAsync() == 0)
        {
            var cats = BackendConstants.CategoryDefs.Select(c => new Category
            {
                Id = IdHelper.NewId(),
                Name = c.Name,
                Slug = c.Slug,
                Icon = c.Icon,
                Image = c.Image
            });
            await categories.InsertManyAsync(cats);
        }

        var cfg = settings.Value;
        await SeedUserAsync(cfg.AdminEmail, cfg.AdminPassword, "New Journey Admin", "admin", true);
        await SeedUserAsync(cfg.DemoCustomerEmail, cfg.DemoCustomerPassword, "Priya Sharma", "customer", true, "+91 9876543210");

        if ((await products.ListAllAsync(1)).Count == 0)
        {
            foreach (var p in ProductSeed)
            {
                var name = p["name"].ToString()!;
                var shortDesc = p.GetValueOrDefault("short_description")?.ToString() ?? "";
                var product = new Product
                {
                    Id = IdHelper.NewId(),
                    Name = name,
                    Slug = IdHelper.Slugify(name),
                    Description = shortDesc + "\n\nCrafted layer-by-layer at our studio using calibrated printers and premium filament. Every print is inspected before it ships.",
                    ShortDescription = shortDesc,
                    CategorySlug = p["category_slug"].ToString()!,
                    Price = Convert.ToDouble(p["price"]),
                    DiscountPrice = p.TryGetValue("discount_price", out var dp) ? Convert.ToDouble(dp) : null,
                    Stock = 25,
                    Material = p.GetValueOrDefault("material")?.ToString() ?? "PLA",
                    WeightG = p.TryGetValue("weight_g", out var wg) ? Convert.ToDouble(wg) : null,
                    Dimensions = p.GetValueOrDefault("dimensions")?.ToString(),
                    PrintTimeHours = p.TryGetValue("print_time_hours", out var pth) ? Convert.ToDouble(pth) : null,
                    ColorVariants = p.TryGetValue("color_variants", out var cv) ? ((string[])cv).ToList() : [],
                    Images = p.TryGetValue("images", out var im) ? ((string[])im).ToList() : [],
                    Featured = p.TryGetValue("featured", out var ft) && (bool)ft,
                    IsActive = true,
                    SeoTitle = name,
                    SeoDescription = shortDesc,
                    RatingAvg = 0,
                    RatingCount = 0,
                    OrdersCount = 0,
                    CreatedAt = IdHelper.NowIso(),
                    UpdatedAt = IdHelper.NowIso()
                };
                await products.InsertAsync(product);
            }
        }

        if (await blog.CountAsync() == 0)
        {
            var posts = new[]
            {
                ("How 3D Printing Actually Works (in 90 seconds)", "FDM, resin, layer heights, adhesion — the mental model behind additive manufacturing.", "3D printing builds objects one thin layer at a time...\n\nMost consumer prints use FDM.", "https://images.unsplash.com/photo-1638959492386-f9a68d55c374?w=1200", new[] { "basics", "guide" }),
                ("Choosing the Right Filament: PLA vs PETG vs ABS", "Which plastic should you order? A field guide.", "PLA is the friendliest — biodegradable, low-warp, great colors...", "https://images.unsplash.com/photo-1633504110842-7618144066fd?w=1200", new[] { "materials" }),
                ("From Idea to Delivery: Inside a New Journey Order", "A behind-the-scenes look at the 10-stage journey.", "Every order flows through the same 10 checkpoints.", "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=1200", new[] { "behind-the-scenes" })
            };
            foreach (var (title, excerpt, content, cover, tags) in posts)
            {
                await blog.InsertAsync(new BlogPost
                {
                    Id = IdHelper.NewId(),
                    Title = title,
                    Slug = IdHelper.Slugify(title),
                    Excerpt = excerpt,
                    Content = content,
                    CoverImage = cover,
                    Tags = tags.ToList(),
                    IsPublished = true,
                    CreatedAt = IdHelper.NowIso(),
                    UpdatedAt = IdHelper.NowIso()
                });
            }
        }

        if (await coupons.CountAsync() == 0)
        {
            await coupons.InsertManyAsync([
                new Coupon { Id = IdHelper.NewId(), Code = "WELCOME10", Kind = "percent", Value = 10, MinOrder = 499, MaxDiscount = 300, IsActive = true, CreatedAt = IdHelper.NowIso() },
                new Coupon { Id = IdHelper.NewId(), Code = "FREESHIP", Kind = "flat", Value = 79, MinOrder = 299, IsActive = true, CreatedAt = IdHelper.NowIso() }
            ]);
        }

        if (await printers.CountAsync() == 0)
        {
            await printers.InsertManyAsync([
                new Printer { Id = IdHelper.NewId(), Name = "Prometheus-01", Model = "Bambu Lab X1C", Status = "printing", NozzleSize = "0.4mm", FilamentLoaded = "PLA — Onyx", CurrentJob = "Voronoi Vase", TotalHours = 1240, CreatedAt = IdHelper.NowIso() },
                new Printer { Id = IdHelper.NewId(), Name = "Prometheus-02", Model = "Bambu Lab X1C", Status = "idle", NozzleSize = "0.4mm", FilamentLoaded = "PETG — Graphite", TotalHours = 980, CreatedAt = IdHelper.NowIso() },
                new Printer { Id = IdHelper.NewId(), Name = "Athena-01", Model = "Prusa MK4", Status = "maintenance", NozzleSize = "0.6mm", TotalHours = 2100, CreatedAt = IdHelper.NowIso() },
                new Printer { Id = IdHelper.NewId(), Name = "Helios-01", Model = "Elegoo Saturn 3", Status = "printing", NozzleSize = "N/A (Resin)", FilamentLoaded = "Grey Resin", CurrentJob = "Anatomy Heart", TotalHours = 640, CreatedAt = IdHelper.NowIso() }
            ]);
        }

        if (await inventory.CountAsync() == 0)
        {
            await inventory.InsertManyAsync([
                new InventoryItem { Id = IdHelper.NewId(), Name = "PLA — Onyx Black", Kind = "filament", Material = "PLA", Color = "Black", Quantity = 12.5, Unit = "kg", ReorderLevel = 3, UnitCost = 1400, Supplier = "eSun", CreatedAt = IdHelper.NowIso(), UpdatedAt = IdHelper.NowIso() },
                new InventoryItem { Id = IdHelper.NewId(), Name = "PLA — Ivory White", Kind = "filament", Material = "PLA", Color = "White", Quantity = 8, Unit = "kg", ReorderLevel = 3, UnitCost = 1400, CreatedAt = IdHelper.NowIso(), UpdatedAt = IdHelper.NowIso() },
                new InventoryItem { Id = IdHelper.NewId(), Name = "PETG — Graphite", Kind = "filament", Material = "PETG", Color = "Grey", Quantity = 2.2, Unit = "kg", ReorderLevel = 3, UnitCost = 1700, CreatedAt = IdHelper.NowIso(), UpdatedAt = IdHelper.NowIso() },
                new InventoryItem { Id = IdHelper.NewId(), Name = "TPU — Jet Black", Kind = "filament", Material = "TPU", Color = "Black", Quantity = 4, Unit = "kg", ReorderLevel = 2, UnitCost = 2200, CreatedAt = IdHelper.NowIso(), UpdatedAt = IdHelper.NowIso() },
                new InventoryItem { Id = IdHelper.NewId(), Name = "Resin — Standard Grey", Kind = "filament", Material = "Resin", Color = "Grey", Quantity = 6, Unit = "L", ReorderLevel = 2, UnitCost = 2800, CreatedAt = IdHelper.NowIso(), UpdatedAt = IdHelper.NowIso() },
                new InventoryItem { Id = IdHelper.NewId(), Name = "Shipping Boxes — Medium", Kind = "packaging", Quantity = 240, Unit = "pcs", ReorderLevel = 100, UnitCost = 12, CreatedAt = IdHelper.NowIso(), UpdatedAt = IdHelper.NowIso() },
                new InventoryItem { Id = IdHelper.NewId(), Name = "Bubble Wrap Roll", Kind = "packaging", Quantity = 4, Unit = "rolls", ReorderLevel = 2, UnitCost = 350, CreatedAt = IdHelper.NowIso(), UpdatedAt = IdHelper.NowIso() },
                new InventoryItem { Id = IdHelper.NewId(), Name = "0.4mm Brass Nozzles", Kind = "tool", Quantity = 18, Unit = "pcs", ReorderLevel = 6, UnitCost = 90, CreatedAt = IdHelper.NowIso(), UpdatedAt = IdHelper.NowIso() }
            ]);
        }

        await permissions.SeedRbacAsync();
        logger.LogInformation("Seed complete");
    }

    private async Task SeedUserAsync(string email, string password, string name, string role, bool verified, string? phone = null)
    {
        var existing = await users.FindByEmailAsync(email.ToLowerInvariant());
        if (existing is null)
        {
            await users.InsertAsync(new User
            {
                Id = IdHelper.NewId(),
                Email = email.ToLowerInvariant(),
                PasswordHash = PasswordHasher.Hash(password),
                Name = name,
                Phone = phone,
                Role = role,
                EmailVerified = verified,
                CreatedAt = IdHelper.NowIso()
            });
        }
        else if (!PasswordHasher.Verify(password, existing.PasswordHash))
        {
            await users.UpdateAsync(existing.Id, new Dictionary<string, object?> { ["password_hash"] = PasswordHasher.Hash(password) });
        }
    }
}

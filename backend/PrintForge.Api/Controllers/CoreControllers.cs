using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PrintForge.Api.Authorization;
using PrintForge.Infrastructure.Configuration;
using PrintForge.Infrastructure.Supabase;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Api.Controllers;

[ApiController]
[Route("api")]
public class HealthController(
    SupabaseHealthService supabaseHealth,
    IUserRepository users,
    IOptions<AppSettings> settings) : ControllerBase
{
    [HttpGet("")]
    public IActionResult Root() => Ok(new { name = "New Journey API", version = "1.0.0", status = "ok" });

    [HttpGet("health")]
    public async Task<IActionResult> Health(CancellationToken cancellationToken)
    {
        var supabase = await supabaseHealth.CheckAsync(cancellationToken);
        var cfg = settings.Value;
        var userCount = await users.CountAsync();
        var adminEmail = (cfg.AdminEmail ?? "").Trim().ToLowerInvariant();
        var adminEmailConfigured = !string.IsNullOrWhiteSpace(adminEmail);
        var adminPasswordConfigured = !string.IsNullOrWhiteSpace(cfg.AdminPassword?.Trim());
        var adminUser = adminEmailConfigured
            ? await users.FindByEmailAsync(adminEmail)
            : null;

        return Ok(new
        {
            ok = true,
            time = IdHelper.NowIso(),
            bootstrap = new
            {
                admin_email_configured = adminEmailConfigured,
                admin_password_configured = adminPasswordConfigured,
                configured_admin_email = adminEmailConfigured ? adminEmail : null,
                admin_account_exists = adminUser is not null,
                user_count = userCount,
                ready = adminEmailConfigured && adminPasswordConfigured && adminUser is not null,
            },
            supabase = new
            {
                ok = supabase.Ok,
                error = supabase.Error,
                sample_module_count = supabase.SampleModuleCount,
            },
        });
    }
}

[ApiController]
[Route("api/categories")]
public class CategoriesController(ICategoryRepository categories) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var cats = await categories.ListAsync();
        return Ok(cats.Select(BsonMapper.ToDict));
    }
}

[ApiController]
[Route("api/products")]
public class ProductsController(IProductService products) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? category, [FromQuery] string? q, [FromQuery] string? material,
        [FromQuery] double? min_price, [FromQuery] double? max_price, [FromQuery] bool? featured,
        [FromQuery] string? sort, [FromQuery] int limit = 60, [FromQuery] int skip = 0) =>
        Ok(await products.ListAsync(category, q, material, min_price, max_price, featured, sort, Math.Min(limit, 200), skip));

    [HttpGet("{slug}")]
    public async Task<IActionResult> Get(string slug)
    {
        try { return Ok(await products.GetBySlugAsync(slug)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Product not found" }); }
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> Create([FromBody] ProductRequest request) =>
        Ok(await products.CreateAsync(HttpContext.GetRequiredUser(), request));

    [HttpPatch("{pid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Update(string pid, [FromBody] Dictionary<string, object?> payload)
    {
        try { return Ok(await products.UpdateAsync(HttpContext.GetRequiredUser(), pid, payload)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
        catch (Exception ex) { return StatusCode(500, new { detail = ex.Message }); }
    }

    [HttpDelete("{pid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Delete(string pid)
    {
        await products.DeleteAsync(HttpContext.GetRequiredUser(), pid);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/admin/products")]
public class AdminProductsController(IProductService products) : ControllerBase
{
    [HttpGet("export")]
    [AdminAuthorize]
    public async Task<IActionResult> Export()
    {
        var (data, filename) = await products.ExportCsvAsync();
        return File(data, "text/csv", filename);
    }

    [HttpPost("import")]
    [AdminAuthorize]
    public async Task<IActionResult> Import(IFormFile file)
    {
        if (file is null || !file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { detail = "CSV file required" });
        await using var stream = file.OpenReadStream();
        return Ok(await products.ImportCsvAsync(HttpContext.GetRequiredUser(), stream));
    }
}

[ApiController]
[Route("api/reviews")]
public class ReviewsController(IReviewRepository reviews, IProductRepository products, IActivityLogService activity) : ControllerBase
{
    [HttpPost]
    [UserAuthorize]
    public async Task<IActionResult> Create([FromBody] ReviewRequest request)
    {
        var user = HttpContext.GetRequiredUser();
        var doc = new Review
        {
            Id = IdHelper.NewId(),
            ProductId = request.ProductId,
            UserId = user.Id,
            UserName = user.Name,
            Rating = request.Rating,
            Title = request.Title,
            Comment = request.Comment,
            Approved = true,
            CreatedAt = IdHelper.NowIso()
        };
        await reviews.InsertAsync(doc);

        var approved = await reviews.FindApprovedByProductAsync(request.ProductId);
        var avg = approved.Count > 0 ? Math.Round(approved.Average(r => r.Rating), 2) : 0;
        await products.UpdateAsync(request.ProductId, new Dictionary<string, object?>
        {
            ["rating_avg"] = avg, ["rating_count"] = approved.Count
        });
        return Ok(BsonMapper.ToDict(doc));
    }

    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> AdminList()
    {
        var items = await reviews.ListAllAsync();
        return Ok(items.Select(BsonMapper.ToDict));
    }

    [HttpPatch("{rid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Moderate(string rid, [FromBody] Dictionary<string, object?> payload)
    {
        await reviews.UpdateAsync(rid, payload);
        await activity.LogAsync(HttpContext.GetRequiredUser(), "review.moderate", rid, payload);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/wishlist")]
public class WishlistController(IWishlistRepository wishlist, IProductRepository products) : ControllerBase
{
    [HttpGet]
    [UserAuthorize]
    public async Task<IActionResult> Get()
    {
        var user = HttpContext.GetRequiredUser();
        var items = await wishlist.FindByUserAsync(user.Id);
        var pids = items.Select(i => i.ProductId).ToList();
        var prods = pids.Count > 0 ? await products.FindByIdsAsync(pids) : [];
        return Ok(prods.Select(BsonMapper.ToDict));
    }

    [HttpPost("{pid}")]
    [UserAuthorize]
    public async Task<IActionResult> Add(string pid)
    {
        var user = HttpContext.GetRequiredUser();
        if (!await wishlist.ExistsAsync(user.Id, pid))
        {
            await wishlist.InsertAsync(new WishlistItem
            {
                Id = IdHelper.NewId(), UserId = user.Id, ProductId = pid, CreatedAt = IdHelper.NowIso()
            });
        }
        return Ok(new OkResponse());
    }

    [HttpDelete("{pid}")]
    [UserAuthorize]
    public async Task<IActionResult> Remove(string pid)
    {
        await wishlist.DeleteAsync(HttpContext.GetRequiredUser().Id, pid);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/addresses")]
public class AddressesController(IAddressRepository addresses) : ControllerBase
{
    [HttpGet]
    [UserAuthorize]
    public async Task<IActionResult> List()
    {
        var items = await addresses.FindByUserAsync(HttpContext.GetRequiredUser().Id);
        return Ok(items.Select(BsonMapper.ToDict));
    }

    [HttpPost]
    [UserAuthorize]
    public async Task<IActionResult> Create([FromBody] AddressRequest request)
    {
        var user = HttpContext.GetRequiredUser();
        if (request.IsDefault) await addresses.ClearDefaultAsync(user.Id);
        var doc = new Address
        {
            Id = IdHelper.NewId(),
            UserId = user.Id,
            Label = request.Label,
            FullName = request.FullName,
            Phone = request.Phone,
            Line1 = request.Line1,
            Line2 = request.Line2,
            City = request.City,
            State = request.State,
            PostalCode = request.PostalCode,
            Country = request.Country,
            IsDefault = request.IsDefault,
            CreatedAt = IdHelper.NowIso()
        };
        await addresses.InsertAsync(doc);
        return Ok(BsonMapper.ToDict(doc));
    }

    [HttpPatch("{aid}")]
    [UserAuthorize]
    public async Task<IActionResult> Update(string aid, [FromBody] Dictionary<string, object?> payload)
    {
        var user = HttpContext.GetRequiredUser();
        if (payload.TryGetValue("is_default", out var d) && d is true or "true")
            await addresses.ClearDefaultAsync(user.Id);
        await addresses.UpdateAsync(aid, user.Id, payload);
        return Ok(new OkResponse());
    }

    [HttpDelete("{aid}")]
    [UserAuthorize]
    public async Task<IActionResult> Delete(string aid)
    {
        await addresses.DeleteAsync(aid, HttpContext.GetRequiredUser().Id);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/coupons")]
public class CouponsController(ICouponService coupons) : ControllerBase
{
    [HttpGet("validate")]
    public async Task<IActionResult> Validate([FromQuery] string code, [FromQuery] double subtotal)
    {
        try
        {
            var result = await coupons.ValidateAsync(code, subtotal);
            return Ok(new { coupon = result.Coupon, discount = result.Discount });
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Invalid coupon" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List() => Ok(await coupons.ListAsync());

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> Create([FromBody] CouponRequest request) =>
        Ok(await coupons.CreateAsync(request));

    [HttpDelete("{cid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Delete(string cid)
    {
        await coupons.DeleteAsync(cid);
        return Ok(new OkResponse());
    }
}

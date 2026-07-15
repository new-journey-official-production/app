using Microsoft.AspNetCore.Mvc;
using PrintForge.Api.Authorization;
using PrintForge.Models.DTOs;
using PrintForge.Services.Interfaces;

namespace PrintForge.Api.Controllers;

/// <summary>Public B2B catalog endpoints (browse, quote, dealer apply, track).</summary>
[ApiController]
[Route("api/b2b")]
public class B2bPublicController(IB2bService b2b) : ControllerBase
{
    [HttpGet("categories")]
    public async Task<IActionResult> Categories([FromQuery] bool tree = true)
    {
        try { return Ok(await b2b.ListCategoriesAsync(includeArchived: false, tree: tree)); }
        catch (Exception ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpGet("categories/{idOrSlug}")]
    public async Task<IActionResult> Category(string idOrSlug)
    {
        try { return Ok(await b2b.GetCategoryAsync(idOrSlug)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpGet("products")]
    public async Task<IActionResult> Products(
        [FromQuery] string? category_id,
        [FromQuery] string? q,
        [FromQuery] string? material,
        [FromQuery] string? color,
        [FromQuery] double? min_price,
        [FromQuery] double? max_price,
        [FromQuery] int? max_moq,
        [FromQuery] bool? featured,
        [FromQuery] bool? best_seller,
        [FromQuery] bool? new_arrival,
        [FromQuery] bool? customization,
        [FromQuery] string? sort,
        [FromQuery] int limit = 60,
        [FromQuery] int skip = 0)
    {
        return Ok(await b2b.ListProductsAsync(
            category_id, q, material, color, min_price, max_price, max_moq,
            featured, best_seller, new_arrival, customization,
            status: "published", visibleOnly: true, sort, Math.Clamp(limit, 1, 200), Math.Max(0, skip)));
    }

    [HttpGet("products/{slugOrId}")]
    public async Task<IActionResult> Product(string slugOrId)
    {
        try { return Ok(await b2b.GetProductAsync(slugOrId, trackView: true)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpPost("quotes")]
    public async Task<IActionResult> CreateQuote([FromBody] B2bQuoteRequestDto request)
    {
        if (!ModelState.IsValid) return BadRequest(new { detail = "Invalid quote request" });
        try { return Ok(await b2b.CreateQuoteAsync(request)); }
        catch (Exception ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpPost("dealers")]
    public async Task<IActionResult> CreateDealer([FromBody] B2bDealerRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(new { detail = "Invalid dealer registration" });
        try { return Ok(await b2b.CreateDealerAsync(request)); }
        catch (Exception ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpPost("track")]
    public async Task<IActionResult> Track([FromBody] B2bAnalyticsTrackRequest request)
    {
        try
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
            var hash = string.IsNullOrEmpty(ip) ? "" : Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(ip)))[..16];
            await b2b.TrackEventAsync(request, hash);
            return Ok(new OkResponse());
        }
        catch (Exception ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpGet("settings")]
    public async Task<IActionResult> Settings() => Ok(await b2b.GetSettingsAsync());

    [HttpPost("catalog/export")]
    public async Task<IActionResult> CatalogExport([FromBody] B2bCatalogExportRequest request)
    {
        try { return Ok(await b2b.GetCatalogExportAsync(request)); }
        catch (Exception ex) { return BadRequest(new { detail = ex.Message }); }
    }
}

/// <summary>Admin B2B management endpoints — separate from retail catalog.</summary>
[ApiController]
[Route("api/admin/b2b")]
[AdminAuthorize]
public class B2bAdminController(IB2bService b2b) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        try { return Ok(await b2b.GetDashboardAsync()); }
        catch (Exception ex) { return StatusCode(500, new { detail = ex.Message }); }
    }

    [HttpGet("analytics")]
    public async Task<IActionResult> Analytics()
    {
        try { return Ok(await b2b.GetAnalyticsAsync()); }
        catch (Exception ex) { return StatusCode(500, new { detail = ex.Message }); }
    }

    // —— Categories ——
    [HttpGet("categories")]
    public async Task<IActionResult> ListCategories([FromQuery] bool include_archived = true, [FromQuery] bool tree = true) =>
        Ok(await b2b.ListCategoriesAsync(include_archived, tree));

    [HttpGet("categories/{id}")]
    public async Task<IActionResult> GetCategory(string id)
    {
        try { return Ok(await b2b.GetCategoryAsync(id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] B2bCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { detail = "Name is required" });
        try { return Ok(await b2b.CreateCategoryAsync(HttpContext.GetRequiredUser(), request)); }
        catch (Exception ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpPatch("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(string id, [FromBody] Dictionary<string, object?> payload)
    {
        try { return Ok(await b2b.UpdateCategoryAsync(HttpContext.GetRequiredUser(), id, payload)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
        catch (Exception ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(string id)
    {
        try { await b2b.DeleteCategoryAsync(HttpContext.GetRequiredUser(), id); return Ok(new OkResponse()); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpPost("categories/{id}/duplicate")]
    public async Task<IActionResult> DuplicateCategory(string id)
    {
        try { return Ok(await b2b.DuplicateCategoryAsync(HttpContext.GetRequiredUser(), id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpPost("categories/reorder")]
    public async Task<IActionResult> ReorderCategories([FromBody] List<Dictionary<string, object?>> items)
    {
        await b2b.ReorderCategoriesAsync(HttpContext.GetRequiredUser(), items ?? []);
        return Ok(new OkResponse());
    }

    // —— Products ——
    [HttpGet("products")]
    public async Task<IActionResult> ListProducts(
        [FromQuery] string? category_id,
        [FromQuery] string? q,
        [FromQuery] string? status,
        [FromQuery] bool? featured,
        [FromQuery] string? sort,
        [FromQuery] int limit = 100,
        [FromQuery] int skip = 0)
    {
        return Ok(await b2b.ListProductsAsync(
            category_id, q, null, null, null, null, null,
            featured, null, null, null, status, null, sort, Math.Clamp(limit, 1, 500), Math.Max(0, skip)));
    }

    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProduct(string id)
    {
        try { return Ok(await b2b.GetProductAsync(id, trackView: false)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] B2bProductRequest request)
    {
        try { return Ok(await b2b.CreateProductAsync(HttpContext.GetRequiredUser(), request)); }
        catch (Exception ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpPatch("products/{id}")]
    public async Task<IActionResult> UpdateProduct(string id, [FromBody] Dictionary<string, object?> payload)
    {
        try { return Ok(await b2b.UpdateProductAsync(HttpContext.GetRequiredUser(), id, payload)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
        catch (Exception ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpDelete("products/{id}")]
    public async Task<IActionResult> DeleteProduct(string id)
    {
        try { await b2b.DeleteProductAsync(HttpContext.GetRequiredUser(), id); return Ok(new OkResponse()); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpPost("products/{id}/duplicate")]
    public async Task<IActionResult> DuplicateProduct(string id)
    {
        try { return Ok(await b2b.DuplicateProductAsync(HttpContext.GetRequiredUser(), id)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpPost("catalog/export")]
    public async Task<IActionResult> CatalogExport([FromBody] B2bCatalogExportRequest request) =>
        Ok(await b2b.GetCatalogExportAsync(request ?? new()));

    // —— Quotes ——
    [HttpGet("quotes")]
    public async Task<IActionResult> ListQuotes([FromQuery] string? status, [FromQuery] int limit = 100, [FromQuery] int skip = 0) =>
        Ok(await b2b.ListQuotesAsync(status, Math.Clamp(limit, 1, 500), Math.Max(0, skip)));

    [HttpPatch("quotes/{id}")]
    public async Task<IActionResult> UpdateQuote(string id, [FromBody] Dictionary<string, object?> payload)
    {
        try { return Ok(await b2b.UpdateQuoteAsync(HttpContext.GetRequiredUser(), id, payload)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpDelete("quotes/{id}")]
    public async Task<IActionResult> DeleteQuote(string id)
    {
        try { await b2b.DeleteQuoteAsync(HttpContext.GetRequiredUser(), id); return Ok(new OkResponse()); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    // —— Dealers ——
    [HttpGet("dealers")]
    public async Task<IActionResult> ListDealers([FromQuery] string? status, [FromQuery] int limit = 100, [FromQuery] int skip = 0) =>
        Ok(await b2b.ListDealersAsync(status, Math.Clamp(limit, 1, 500), Math.Max(0, skip)));

    [HttpPatch("dealers/{id}")]
    public async Task<IActionResult> UpdateDealer(string id, [FromBody] Dictionary<string, object?> payload)
    {
        try { return Ok(await b2b.UpdateDealerAsync(HttpContext.GetRequiredUser(), id, payload)); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    [HttpDelete("dealers/{id}")]
    public async Task<IActionResult> DeleteDealer(string id)
    {
        try { await b2b.DeleteDealerAsync(HttpContext.GetRequiredUser(), id); return Ok(new OkResponse()); }
        catch (KeyNotFoundException ex) { return NotFound(new { detail = ex.Message }); }
    }

    // —— Settings ——
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings() => Ok(await b2b.GetSettingsAsync());

    [HttpPatch("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] B2bSettingsRequest request) =>
        Ok(await b2b.UpdateSettingsAsync(HttpContext.GetRequiredUser(), request ?? new()));
}

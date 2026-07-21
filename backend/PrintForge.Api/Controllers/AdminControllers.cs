using Microsoft.AspNetCore.Mvc;
using PrintForge.Api.Authorization;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services;
using PrintForge.Services.Interfaces;

namespace PrintForge.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(IOrderService orders) : ControllerBase
{
    [HttpPost]
    [UserAuthorize]
    public async Task<IActionResult> Create([FromBody] OrderCreateRequest request)
    {
        try { return Ok(await orders.CreateAsync(HttpContext.GetRequiredUser(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpGet]
    [UserAuthorize]
    public async Task<IActionResult> MyOrders() =>
        Ok(await orders.GetMyOrdersAsync(HttpContext.GetRequiredUser().Id));

    [HttpGet("{oid}")]
    [UserAuthorize]
    public async Task<IActionResult> Get(string oid)
    {
        try { return Ok(await orders.GetOrderAsync(HttpContext.GetRequiredUser(), oid)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }

    [HttpDelete("{oid}")]
    [UserAuthorize]
    public async Task<IActionResult> Delete(string oid)
    {
        try
        {
            await orders.UserDeleteAsync(HttpContext.GetRequiredUser(), oid);
            return Ok(new OkResponse());
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Order not found" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }
}

[ApiController]
[Route("api/admin/orders")]
public class AdminOrdersController(IOrderService orders) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] string? q, [FromQuery] int limit = 100) =>
        Ok(await orders.AdminListAsync(status, q, limit));

    [HttpPatch("{oid}/status")]
    [AdminAuthorize]
    public async Task<IActionResult> UpdateStatus(string oid, [FromBody] Dictionary<string, object?> payload)
    {
        try { return Ok(await orders.AdminUpdateStatusAsync(HttpContext.GetRequiredUser(), oid, payload)); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Order not found" }); }
    }

    [HttpPatch("{oid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Update(string oid, [FromBody] Dictionary<string, object?> payload)
    {
        try { return Ok(await orders.AdminUpdateAsync(oid, payload)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }

    [HttpDelete("{oid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Delete(string oid)
    {
        try
        {
            await orders.AdminDeleteAsync(HttpContext.GetRequiredUser(), oid);
            return Ok(new OkResponse());
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Order not found" }); }
    }
}

[ApiController]
[Route("api/admin/billing")]
public class AdminBillingController(IBillingService billing) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] string? q,
        [FromQuery] int limit = 200,
        [FromQuery] string? method = null,
        [FromQuery] string? from = null,
        [FromQuery] string? to = null) =>
        Ok(await billing.AdminListAsync(status, q, limit, method, from, to));

    [HttpGet("order/{orderId}")]
    [AdminAuthorize]
    public async Task<IActionResult> GetByOrder(string orderId)
    {
        try { return Ok(await billing.GetOrderBillingAsync(orderId)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }

    [HttpGet("analytics")]
    [AdminAuthorize]
    public async Task<IActionResult> Analytics(
        [FromQuery] string? status,
        [FromQuery] string? method,
        [FromQuery] string? from,
        [FromQuery] string? to) =>
        Ok(await billing.GetPaymentAnalyticsAsync(status, method, from, to));

    [HttpPatch("{paymentId}/status")]
    [AdminAuthorize]
    public async Task<IActionResult> UpdateStatus(string paymentId, [FromBody] Dictionary<string, object?> payload)
    {
        var status = payload.GetValueOrDefault("status")?.ToString();
        if (string.IsNullOrWhiteSpace(status))
            return BadRequest(new { detail = "status is required" });
        try { return Ok(await billing.UpdateStatusAsync(HttpContext.GetRequiredUser(), paymentId, status)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Payment not found" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }
}

[ApiController]
[Route("api/inventory")]
public class InventoryController(IInventoryRepository inventory) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List()
    {
        var items = await inventory.ListAsync();
        return Ok(items.Select(BsonMapper.ToDict));
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> Create([FromBody] InventoryRequest request)
    {
        var doc = new InventoryItem
        {
            Id = IdHelper.NewId(),
            Name = request.Name,
            Kind = request.Kind,
            Material = request.Material,
            Color = request.Color,
            Quantity = request.Quantity,
            Unit = request.Unit,
            ReorderLevel = request.ReorderLevel,
            UnitCost = request.UnitCost,
            Supplier = request.Supplier,
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso()
        };
        await inventory.InsertAsync(doc);
        return Ok(BsonMapper.ToDict(doc));
    }

    [HttpPatch("{iid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Update(string iid, [FromBody] Dictionary<string, object?> payload)
    {
        payload["updated_at"] = IdHelper.NowIso();
        await inventory.UpdateAsync(iid, payload);
        var item = await inventory.ListAsync();
        var found = item.FirstOrDefault(i => i.Id == iid);
        return Ok(found is null ? payload : BsonMapper.ToDict(found));
    }

    [HttpDelete("{iid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Delete(string iid)
    {
        await inventory.DeleteAsync(iid);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/printers")]
public class PrintersController(IPrinterRepository printers) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List()
    {
        var items = await printers.ListAsync();
        return Ok(items.Select(BsonMapper.ToDict));
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> Create([FromBody] PrinterRequest request)
    {
        var doc = new Printer
        {
            Id = IdHelper.NewId(),
            Name = request.Name,
            Model = request.Model,
            Status = request.Status,
            NozzleSize = request.NozzleSize,
            FilamentLoaded = request.FilamentLoaded,
            CurrentJob = request.CurrentJob,
            TotalHours = request.TotalHours,
            CreatedAt = IdHelper.NowIso()
        };
        await printers.InsertAsync(doc);
        return Ok(BsonMapper.ToDict(doc));
    }

    [HttpPatch("{pid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Update(string pid, [FromBody] Dictionary<string, object?> payload)
    {
        await printers.UpdateAsync(pid, payload);
        var items = await printers.ListAsync();
        var found = items.FirstOrDefault(p => p.Id == pid);
        return Ok(found is null ? payload : BsonMapper.ToDict(found));
    }

    [HttpDelete("{pid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Delete(string pid)
    {
        await printers.DeleteAsync(pid);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/admin/customers")]
public class CustomersController(IUserRepository users, IOrderRepository orders) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List()
    {
        var customers = await users.FindCustomersAsync();
        var result = new List<Dictionary<string, object?>>();
        foreach (var u in customers)
        {
            var userOrders = await orders.FindByUserAsync(u.Id);
            var dict = BsonMapper.ToDict(u);
            dict.Remove("password_hash");
            dict["lifetime_spend"] = Math.Round(userOrders.Sum(o => o.Total), 2);
            dict["orders_count"] = userOrders.Count;
            result.Add(dict);
        }
        return Ok(result);
    }
}

[ApiController]
[Route("api/support/tickets")]
public class SupportController(ITicketRepository tickets, IEmailService email) : ControllerBase
{
    [HttpGet]
    [UserAuthorize]
    public async Task<IActionResult> MyTickets()
    {
        var items = await tickets.FindByUserAsync(HttpContext.GetRequiredUser().Id);
        return Ok(items.Select(BsonMapper.ToDict));
    }

    [HttpPost]
    [UserAuthorize]
    public async Task<IActionResult> Create([FromBody] TicketRequest request)
    {
        var user = HttpContext.GetRequiredUser();
        var doc = new Ticket
        {
            Id = IdHelper.NewId(),
            UserId = user.Id,
            UserName = user.Name,
            UserEmail = user.Email,
            Subject = request.Subject,
            OrderNo = request.OrderNo,
            Status = "open",
            Messages = [new TicketMessage { From = "customer", Message = request.Message, At = IdHelper.NowIso() }],
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso()
        };
        await tickets.InsertAsync(doc);
        return Ok(BsonMapper.ToDict(doc));
    }

    [HttpPost("{tid}/reply")]
    [UserAuthorize]
    public async Task<IActionResult> Reply(string tid, [FromBody] TicketReplyRequest request)
    {
        var user = HttpContext.GetRequiredUser();
        var t = await tickets.FindByIdAsync(tid);
        if (t is null) return NotFound(new { detail = "Ticket not found" });
        if (user.Role == "customer" && t.UserId != user.Id)
            return StatusCode(403, new { detail = "Forbidden" });

        var who = user.Role is "admin" or "staff" ? "admin" : "customer";
        var msg = new TicketMessage { From = who, Message = request.Message, At = IdHelper.NowIso() };
        var status = who == "admin" ? "answered" : "open";
        await tickets.PushMessageAsync(tid, msg, status);

        if (who == "admin")
            await email.SendAsync(t.UserEmail, "support_reply", new Dictionary<string, object?>
            {
                ["ticket_id"] = tid, ["message"] = request.Message
            });

        var updated = await tickets.FindByIdAsync(tid);
        return Ok(BsonMapper.ToDict(updated!));
    }
}

[ApiController]
[Route("api/admin/tickets")]
public class AdminTicketsController(ITicketRepository tickets) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List()
    {
        var items = await tickets.ListAllAsync();
        return Ok(items.Select(BsonMapper.ToDict));
    }

    [HttpPatch("{tid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Update(string tid, [FromBody] Dictionary<string, object?> payload)
    {
        await tickets.UpdateAsync(tid, payload);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/notifications")]
public class NotificationsController(INotificationRepository notifications) : ControllerBase
{
    [HttpGet]
    [UserAuthorize]
    public async Task<IActionResult> List()
    {
        var items = await notifications.FindByUserAsync(HttpContext.GetRequiredUser().Id);
        return Ok(items.Select(BsonMapper.ToDict));
    }

    [HttpPost("{nid}/read")]
    [UserAuthorize]
    public async Task<IActionResult> MarkRead(string nid)
    {
        await notifications.MarkReadAsync(nid, HttpContext.GetRequiredUser().Id);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/blog")]
public class BlogController(IBlogRepository blog) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int limit = 20)
    {
        var items = await blog.ListPublishedAsync(limit);
        return Ok(items.Select(BsonMapper.ToDict));
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> Get(string slug)
    {
        var b = await blog.FindBySlugAsync(slug);
        return b is null ? NotFound(new { detail = "Not found" }) : Ok(BsonMapper.ToDict(b));
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> Create([FromBody] BlogPostRequest request)
    {
        var slug = request.Slug ?? IdHelper.Slugify(request.Title);
        var doc = new BlogPost
        {
            Id = IdHelper.NewId(),
            Title = request.Title,
            Slug = slug,
            Excerpt = request.Excerpt,
            Content = request.Content,
            CoverImage = request.CoverImage,
            Tags = request.Tags,
            IsPublished = request.IsPublished,
            CreatedAt = IdHelper.NowIso(),
            UpdatedAt = IdHelper.NowIso()
        };
        await blog.InsertAsync(doc);
        return Ok(BsonMapper.ToDict(doc));
    }

    [HttpPatch("{bid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Update(string bid, [FromBody] Dictionary<string, object?> payload)
    {
        payload["updated_at"] = IdHelper.NowIso();
        await blog.UpdateAsync(bid, payload);
        return Ok(new OkResponse());
    }

    [HttpDelete("{bid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Delete(string bid)
    {
        await blog.DeleteAsync(bid);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api")]
public class PublicController(IEmailService email, INewsletterRepository newsletter, IContactRepository contact) : ControllerBase
{
    [HttpPost("newsletter")]
    public async Task<IActionResult> Newsletter([FromBody] NewsletterRequest request)
    {
        var emailNorm = request.Email.ToLowerInvariant();
        await newsletter.UpsertAsync(emailNorm, IdHelper.NewId(), IdHelper.NowIso());
        await email.SendAsync(emailNorm, "newsletter", []);
        return Ok(new OkResponse());
    }

    [HttpPost("contact")]
    public async Task<IActionResult> Contact([FromBody] ContactRequest request)
    {
        var doc = new ContactMessage
        {
            Id = IdHelper.NewId(),
            Name = request.Name,
            Email = request.Email,
            Subject = request.Subject,
            Message = request.Message,
            CreatedAt = IdHelper.NowIso()
        };
        await contact.InsertAsync(doc);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/admin/analytics")]
public class AnalyticsController(IAnalyticsService analytics) : ControllerBase
{
    [HttpGet("summary")]
    [AdminAuthorize]
    public async Task<IActionResult> Summary() => Ok(await analytics.GetSummaryAsync());
}

[ApiController]
[Route("api/admin/media")]
public class MediaController(IMediaService media) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List([FromQuery] int limit = 200) =>
        Ok(await media.ListAsync(limit));

    [HttpGet("{mid}")]
    public async Task<IActionResult> Get(string mid)
    {
        try
        {
            var (data, contentType) = await media.GetBinaryAsync(mid);
            Response.Headers.CacheControl = "public, max-age=31536000";
            return File(data, contentType);
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }

    [HttpPost("upload")]
    [AdminAuthorize]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file is null) return BadRequest(new { detail = "File required" });
        try
        {
            await using var stream = file.OpenReadStream();
            return Ok(await media.UploadAsync(HttpContext.GetRequiredUser(), stream, file.FileName, file.ContentType));
        }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpDelete("{mid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Delete(string mid)
    {
        await media.DeleteAsync(HttpContext.GetRequiredUser(), mid);
        return Ok(new OkResponse());
    }
}

[ApiController]
[Route("api/admin/activity-logs")]
public class ActivityLogsController(IActivityLogRepository logs) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List([FromQuery] int limit = 200, [FromQuery] string? action = null)
    {
        var items = await logs.ListAsync(Math.Min(limit, 1000), action);
        return Ok(items.Select(BsonMapper.ToDict));
    }
}

[ApiController]
[Route("api/admin/accounts")]
public class AdminAccountsController(IFinanceService finance) : ControllerBase
{
    [HttpGet("overview")]
    [AdminAuthorize]
    public async Task<IActionResult> Overview() => Ok(await finance.GetOverviewAsync());

    [HttpGet("entries")]
    [AdminAuthorize]
    public async Task<IActionResult> ListEntries([FromQuery] string? kind) =>
        Ok(await finance.ListEntriesAsync(kind));

    [HttpPost("entries")]
    [AdminAuthorize]
    public async Task<IActionResult> CreateEntry([FromBody] Dictionary<string, object?> payload)
    {
        try { return Ok(await finance.CreateEntryAsync(HttpContext.GetRequiredUser(), payload)); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { detail = $"Accounts save failed: {ex.Message}" }); }
    }

    [HttpPatch("entries/{id}")]
    [AdminAuthorize]
    public async Task<IActionResult> UpdateEntry(string id, [FromBody] Dictionary<string, object?> payload)
    {
        try { return Ok(await finance.UpdateEntryAsync(id, payload)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpDelete("entries/{id}")]
    [AdminAuthorize]
    public async Task<IActionResult> DeleteEntry(string id)
    {
        try
        {
            await finance.DeleteEntryAsync(id);
            return Ok(new OkResponse());
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }
}

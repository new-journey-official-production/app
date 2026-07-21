using Microsoft.AspNetCore.Mvc;
using PrintForge.Api.Authorization;
using PrintForge.Models.DTOs;
using PrintForge.Services.Interfaces;

namespace PrintForge.Api.Controllers;

/// <summary>Admin payment configuration master APIs.</summary>
[ApiController]
[Route("api/admin/payment-configurations")]
public class AdminPaymentConfigurationController(IPaymentConfigurationService configs) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List([FromQuery] bool active_only = false) =>
        Ok(await configs.ListAsync(active_only));

    [HttpGet("{id}")]
    [AdminAuthorize]
    public async Task<IActionResult> Get(string id)
    {
        try { return Ok(await configs.GetAsync(id)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }

    [HttpPost]
    [AdminAuthorize]
    public async Task<IActionResult> Create([FromBody] PaymentConfigurationRequest request)
    {
        try { return Ok(await configs.CreateAsync(HttpContext.GetRequiredUser(), request)); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpPut("{id}")]
    [AdminAuthorize]
    public async Task<IActionResult> Update(string id, [FromBody] PaymentConfigurationRequest request)
    {
        try { return Ok(await configs.UpdateAsync(HttpContext.GetRequiredUser(), id, request)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpDelete("{id}")]
    [AdminAuthorize]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            await configs.DeleteAsync(HttpContext.GetRequiredUser(), id);
            return Ok(new OkResponse());
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }
}

/// <summary>Central payment approval queue for manual UPI verification.</summary>
[ApiController]
[Route("api/admin/approvals")]
public class AdminApprovalsController(IBillingService billing) : ControllerBase
{
    [HttpGet("summary")]
    [AdminAuthorize]
    public async Task<IActionResult> Summary() =>
        Ok(await billing.GetApprovalSummaryAsync());

    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List(
        [FromQuery] string? status = "verification_pending",
        [FromQuery] string? q = null,
        [FromQuery] int limit = 200) =>
        Ok(await billing.AdminListAsync(status, q, limit));

    [HttpGet("{paymentId}")]
    [AdminAuthorize]
    public async Task<IActionResult> Get(string paymentId)
    {
        try
        {
            var rows = await billing.AdminListAsync(null, null, 500);
            var row = rows.FirstOrDefault(r => r.GetValueOrDefault("id")?.ToString() == paymentId);
            if (row is null) return NotFound(new { detail = "Not found" });
            var orderId = row.GetValueOrDefault("order_id")?.ToString();
            if (string.IsNullOrEmpty(orderId)) return NotFound(new { detail = "Not found" });
            return Ok(await billing.GetOrderBillingAsync(orderId));
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }

    [HttpPost("{paymentId}/approve")]
    [AdminAuthorize]
    public async Task<IActionResult> Approve(string paymentId)
    {
        try { return Ok(await billing.ApproveAsync(HttpContext.GetRequiredUser(), paymentId)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpPost("{paymentId}/reject")]
    [AdminAuthorize]
    public async Task<IActionResult> Reject(string paymentId, [FromBody] RejectPaymentRequest request)
    {
        try { return Ok(await billing.RejectAsync(HttpContext.GetRequiredUser(), paymentId, request)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }
}

/// <summary>Admin notification configuration master.</summary>
[ApiController]
[Route("api/admin/notification-configurations")]
public class AdminNotificationConfigurationController(INotificationDispatchService notifications) : ControllerBase
{
    [HttpGet]
    [AdminAuthorize]
    public async Task<IActionResult> List() =>
        Ok(await notifications.ListConfigsAsync());

    [HttpPut("{id}")]
    [AdminAuthorize]
    public async Task<IActionResult> Update(string id, [FromBody] NotificationConfigurationRequest request)
    {
        try { return Ok(await notifications.UpdateConfigAsync(HttpContext.GetRequiredUser(), id, request)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }
}

/// <summary>Customer payment page + proof submission APIs.</summary>
[ApiController]
[Route("api/payments")]
public class PaymentsController(
    IBillingService billing,
    IPaymentConfigurationService configs,
    IOrderService orders,
    IMediaService media) : ControllerBase
{
    [HttpGet("config/upi")]
    [UserAuthorize]
    public async Task<IActionResult> ActiveUpiConfig()
    {
        try { return Ok(await configs.GetActiveUpiAsync()); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "No active UPI configuration" }); }
    }

    [HttpGet("order/{orderId}")]
    [UserAuthorize]
    public async Task<IActionResult> GetOrderPayment(string orderId)
    {
        try
        {
            var order = await orders.GetOrderAsync(HttpContext.GetRequiredUser(), orderId);
            var config = await configs.GetActiveUpiAsync();
            return Ok(new Dictionary<string, object?>
            {
                ["order"] = order,
                ["payment"] = order.GetValueOrDefault("payment"),
                ["config"] = config,
            });
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }

    [HttpPost("order/{orderId}/proof")]
    [UserAuthorize]
    public async Task<IActionResult> SubmitProof(string orderId, [FromBody] SubmitPaymentProofRequest request)
    {
        try { return Ok(await billing.SubmitProofAsync(HttpContext.GetRequiredUser(), orderId, request)); }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    /// <summary>Secure payment-proof upload (PNG/JPG/WEBP, max 3MB).</summary>
    [HttpPost("proof-upload")]
    [UserAuthorize]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public async Task<IActionResult> UploadProof(IFormFile file)
    {
        if (file is null) return BadRequest(new { detail = "File required" });
        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/png", "image/jpeg", "image/webp"
        };
        if (!allowed.Contains(file.ContentType))
            return BadRequest(new { detail = "Only PNG, JPG, and WEBP images are allowed" });
        try
        {
            await using var stream = file.OpenReadStream();
            var uploaded = await media.UploadAsync(HttpContext.GetRequiredUser(), stream, file.FileName, file.ContentType);
            // Expose via authenticated payment media route (not admin-only library).
            uploaded.Url = $"/api/payments/media/{uploaded.Id}";
            return Ok(uploaded);
        }
        catch (InvalidOperationException ex) { return BadRequest(new { detail = ex.Message }); }
    }

    [HttpGet("media/{mid}")]
    [UserAuthorize]
    public async Task<IActionResult> GetProofMedia(string mid)
    {
        try
        {
            var (data, contentType) = await media.GetBinaryAsync(mid);
            return File(data, contentType);
        }
        catch (KeyNotFoundException) { return NotFound(new { detail = "Not found" }); }
    }
}

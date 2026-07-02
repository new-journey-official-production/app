using PrintForge.Models;
using PrintForge.Models.Entities;

namespace PrintForge.Infrastructure.Context;

/// <summary>Per-request tenant, location, user, and permission state.</summary>
public class RequestContext
{
    public string TenantId { get; set; } = Constants.BackendConstants.DefaultTenantId;
    public string LocationId { get; set; } = Constants.BackendConstants.DefaultLocationId;
    public User? User { get; set; }
    public Dictionary<string, int> Permissions { get; set; } = [];
    public string? ModuleId { get; set; }
}

public static class RequestContextAccessor
{
    private static readonly AsyncLocal<RequestContext?> Current = new();

    public static RequestContext Get() => Current.Value ??= new RequestContext();

    public static void Set(RequestContext ctx) => Current.Value = ctx;
}

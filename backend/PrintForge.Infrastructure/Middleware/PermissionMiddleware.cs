using Microsoft.AspNetCore.Http;
using PrintForge.Constants;
using PrintForge.Infrastructure.Context;

namespace PrintForge.Infrastructure.Middleware;

/// <summary>Enforces bitmask RBAC when moduleID header is present on admin routes.</summary>
public class PermissionMiddleware
{
    private readonly RequestDelegate _next;

    public PermissionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext http)
    {
        var ctx = RequestContextAccessor.Get();
        var moduleId = ctx.ModuleId;

        if (!string.IsNullOrEmpty(moduleId) && ctx.User is not null)
        {
            var bits = ctx.Permissions.GetValueOrDefault(moduleId, 0);
            var method = http.Request.Method.ToUpperInvariant();
            var required = method switch
            {
                "GET" or "HEAD" => (int)CPPermissions.Read,
                "POST" => (int)CPPermissions.Create,
                "PUT" or "PATCH" => (int)CPPermissions.Update,
                "DELETE" => (int)CPPermissions.Delete,
                _ => 0
            };

            if (required > 0 && !PermissionHelper.HasPermission(bits, required))
            {
                http.Response.StatusCode = StatusCodes.Status403Forbidden;
                http.Response.ContentType = "application/json";
                await http.Response.WriteAsync("{\"detail\":\"Insufficient permissions\"}");
                return;
            }
        }

        await _next(http);
    }
}

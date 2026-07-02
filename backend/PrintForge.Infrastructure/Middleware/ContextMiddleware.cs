using Microsoft.AspNetCore.Http;
using PrintForge.Infrastructure.Auth;
using PrintForge.Infrastructure.Context;
namespace PrintForge.Infrastructure.Middleware;

/// <summary>Parse tenant/location headers and preload user permissions into request context.</summary>
public class ContextMiddleware
{
    private readonly RequestDelegate _next;

    public ContextMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(
        HttpContext http,
        JwtService jwt,
        IAuthUserProvider authProvider)
    {
        var ctx = new RequestContext
        {
            TenantId = http.Request.Headers["tenant_id"].FirstOrDefault() ?? Constants.BackendConstants.DefaultTenantId,
            LocationId = http.Request.Headers["l_id"].FirstOrDefault() ?? Constants.BackendConstants.DefaultLocationId,
            ModuleId = http.Request.Headers["moduleID"].FirstOrDefault()
        };

        var token = http.Request.Cookies[Constants.BackendConstants.AccessTokenCookie];
        if (string.IsNullOrEmpty(token))
        {
            var auth = http.Request.Headers["Authorization"].FirstOrDefault();
            if (auth?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
                token = auth[7..];
        }

        if (!string.IsNullOrEmpty(token))
        {
            var userId = jwt.GetUserIdFromToken(token);
            var tokenType = jwt.GetTokenType(token);
            if (!string.IsNullOrEmpty(userId) && tokenType == "access")
            {
                var user = await authProvider.GetUserByIdAsync(userId);
                if (user is not null)
                {
                    ctx.User = user;
                    ctx.Permissions = await authProvider.GetPermissionsAsync(userId);
                }
            }
        }

        RequestContextAccessor.Set(ctx);
        http.Items["ctx"] = ctx;
        await _next(http);
    }
}

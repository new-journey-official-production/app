using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PrintForge.Constants;
using PrintForge.Infrastructure.Context;
using PrintForge.Models.Entities;
using PrintForge.Services.Interfaces;

namespace PrintForge.Api.Authorization;

/// <summary>Legacy admin gate — admin/staff role or DASHBOARD READ via RBAC.</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AdminAuthorizeAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = GetUser(context);
        if (user is null)
        {
            context.Result = new UnauthorizedObjectResult(new { detail = "Not authenticated" });
            return;
        }

        if (user.Role is "admin" or "staff") return;

        var perms = context.HttpContext.RequestServices.GetRequiredService<IPermissionService>();
        var hasAdmin = await perms.CheckPermissionAsync(user.Id, Modules.Dashboard, (int)CPPermissions.Read);
        if (!hasAdmin)
            context.Result = new ObjectResult(new { detail = "Admin access required" }) { StatusCode = 403 };
    }

    internal static User? GetUser(AuthorizationFilterContext context)
    {
        if (context.HttpContext.Items["ctx"] is RequestContext rc && rc.User is not null)
            return rc.User;
        return RequestContextAccessor.Get().User;
    }
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class UserAuthorizeAttribute : Attribute, IAsyncAuthorizationFilter
{
    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = AdminAuthorizeAttribute.GetUser(context);
        if (user is null)
            context.Result = new UnauthorizedObjectResult(new { detail = "Not authenticated" });
        return Task.CompletedTask;
    }
}

public static class HttpContextUserExtensions
{
    public static User GetRequiredUser(this HttpContext http)
    {
        if (http.Items["ctx"] is RequestContext rc && rc.User is not null) return rc.User;
        var user = RequestContextAccessor.Get().User;
        return user ?? throw new UnauthorizedAccessException("Not authenticated");
    }
}

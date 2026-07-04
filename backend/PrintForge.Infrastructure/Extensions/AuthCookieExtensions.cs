using Microsoft.AspNetCore.Http;
using PrintForge.Constants;
using PrintForge.Infrastructure.Auth;

namespace PrintForge.Infrastructure.Extensions;

public static class AuthCookieExtensions
{
    /// <summary>
    /// Production uses Secure + SameSite=None so httpOnly auth cookies work when the SPA
    /// (Vercel) and API (Render) are on different origins.
    /// </summary>
    private static CookieOptions CreateAuthCookieOptions(TimeSpan maxAge)
    {
        var isProduction = string.Equals(
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            "Production",
            StringComparison.OrdinalIgnoreCase);

        return new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = isProduction ? SameSiteMode.None : SameSiteMode.Lax,
            MaxAge = maxAge,
            Path = "/"
        };
    }

    public static void SetAuthCookies(this HttpResponse response, JwtService jwt, string userId)
    {
        var access = jwt.CreateToken(userId, "access");
        var refresh = jwt.CreateToken(userId, "refresh");

        response.Cookies.Append(
            BackendConstants.AccessTokenCookie,
            access,
            CreateAuthCookieOptions(TimeSpan.FromMinutes(BackendConstants.AccessTokenMinutes)));

        response.Cookies.Append(
            BackendConstants.RefreshTokenCookie,
            refresh,
            CreateAuthCookieOptions(TimeSpan.FromDays(BackendConstants.RefreshTokenDays)));
    }

    public static void ClearAuthCookies(this HttpResponse response)
    {
        var deleteOptions = CreateAuthCookieOptions(TimeSpan.Zero);
        response.Cookies.Delete(BackendConstants.AccessTokenCookie, deleteOptions);
        response.Cookies.Delete(BackendConstants.RefreshTokenCookie, deleteOptions);
    }
}

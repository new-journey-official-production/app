using Microsoft.AspNetCore.Http;
using PrintForge.Constants;
using PrintForge.Infrastructure.Auth;

namespace PrintForge.Infrastructure.Extensions;

public static class AuthCookieExtensions
{
    public static void SetAuthCookies(this HttpResponse response, JwtService jwt, string userId)
    {
        var access = jwt.CreateToken(userId, "access");
        var refresh = jwt.CreateToken(userId, "refresh");

        response.Cookies.Append(BackendConstants.AccessTokenCookie, access, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromMinutes(BackendConstants.AccessTokenMinutes),
            Path = "/"
        });

        response.Cookies.Append(BackendConstants.RefreshTokenCookie, refresh, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromDays(BackendConstants.RefreshTokenDays),
            Path = "/"
        });
    }

    public static void ClearAuthCookies(this HttpResponse response)
    {
        response.Cookies.Delete(BackendConstants.AccessTokenCookie, new CookieOptions { Path = "/" });
        response.Cookies.Delete(BackendConstants.RefreshTokenCookie, new CookieOptions { Path = "/" });
    }
}

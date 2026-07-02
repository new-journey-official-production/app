using Microsoft.AspNetCore.Mvc;
using PrintForge.Api.Authorization;
using PrintForge.Infrastructure.Auth;
using PrintForge.Infrastructure.Extensions;
using PrintForge.Models.DTOs;
using PrintForge.Services.Interfaces;

namespace PrintForge.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService auth, JwtService jwt) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await auth.RegisterAsync(request);
            Response.SetAuthCookies(jwt, user.Id);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await auth.LoginAsync(request);
            Response.SetAuthCookies(jwt, user.Id);
            return Ok(user);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { detail = ex.Message });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.ClearAuthCookies();
        return Ok(new OkResponse());
    }

    [HttpGet("me")]
    [UserAuthorize]
    public IActionResult Me() => Ok(PrintForge.Models.UserMapper.ToDto(HttpContext.GetRequiredUser()));

    [HttpPost("refresh")]
    public IActionResult Refresh()
    {
        var token = Request.Cookies[Constants.BackendConstants.RefreshTokenCookie];
        if (string.IsNullOrEmpty(token))
            return Unauthorized(new { detail = "No refresh token" });

        var userId = jwt.GetUserIdFromToken(token);
        if (string.IsNullOrEmpty(userId) || jwt.GetTokenType(token) != "refresh")
            return Unauthorized(new { detail = "Invalid refresh token" });

        Response.SetAuthCookies(jwt, userId);
        return Ok(new OkResponse());
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        await auth.ForgotPasswordAsync(request);
        return Ok(new MessageResponse(true, "If that email exists, a reset link was sent."));
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await auth.ResetPasswordAsync(request);
            return Ok(new OkResponse());
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPatch("profile")]
    [UserAuthorize]
    public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateRequest request)
    {
        var user = HttpContext.GetRequiredUser();
        var updated = await auth.UpdateProfileAsync(user.Id, request);
        return Ok(updated);
    }
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PrintForge.Constants;
using PrintForge.Infrastructure.Configuration;

namespace PrintForge.Infrastructure.Auth;

/// <summary>JWT token creation and validation.</summary>
public class JwtService
{
    private readonly AppSettings _settings;
    private readonly SymmetricSecurityKey _key;

    public JwtService(IOptions<AppSettings> settings)
    {
        _settings = settings.Value;
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.JwtSecret));
    }

    public string CreateToken(string userId, string kind = "access")
    {
        var expires = kind == "access"
            ? DateTime.UtcNow.AddMinutes(BackendConstants.AccessTokenMinutes)
            : DateTime.UtcNow.AddDays(BackendConstants.RefreshTokenDays);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId),
            new Claim("type", kind)
        };

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = _key,
                ClockSkew = TimeSpan.FromMinutes(1)
            }, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public string? GetUserIdFromToken(string token)
    {
        var principal = ValidateToken(token);
        return principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
               ?? principal?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
    }

    public string? GetTokenType(string token)
    {
        var principal = ValidateToken(token);
        return principal?.FindFirst("type")?.Value;
    }
}

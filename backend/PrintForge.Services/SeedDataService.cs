using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PrintForge.Infrastructure.Auth;
using PrintForge.Infrastructure.Configuration;
using PrintForge.Models;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

/// <summary>
/// Minimal startup seed — RBAC roles/permissions only, plus optional first admin from env vars.
/// Catalog, categories, and demo content are managed via the admin panel (stored in Postgres).
/// </summary>
public class SeedDataService(
    IOptions<AppSettings> settings,
    IUserRepository users,
    IPermissionService permissions,
    ILogger<SeedDataService> logger) : ISeedDataService
{
    public async Task SeedAsync()
    {
        await permissions.SeedRbacAsync();

        var cfg = settings.Value;
        if (!string.IsNullOrWhiteSpace(cfg.AdminEmail) && !string.IsNullOrWhiteSpace(cfg.AdminPassword))
            await EnsureAdminUserAsync(cfg.AdminEmail, cfg.AdminPassword);

        logger.LogInformation("Seed complete (RBAC only; catalog is empty until admin adds data)");
    }

    /// <summary>Creates the bootstrap admin when env vars are set and no user exists yet.</summary>
    private async Task EnsureAdminUserAsync(string email, string password)
    {
        var normalized = email.Trim().ToLowerInvariant();
        var existing = await users.FindByEmailAsync(normalized);
        if (existing is null)
        {
            await users.InsertAsync(new User
            {
                Id = IdHelper.NewId(),
                Email = normalized,
                PasswordHash = PasswordHasher.Hash(password),
                Name = "Store Admin",
                Role = "admin",
                EmailVerified = true,
                CreatedAt = IdHelper.NowIso()
            });
            return;
        }

        if (!PasswordHasher.Verify(password, existing.PasswordHash))
        {
            await users.UpdateAsync(existing.Id, new Dictionary<string, object?>
            {
                ["password_hash"] = PasswordHasher.Hash(password)
            });
        }
    }
}

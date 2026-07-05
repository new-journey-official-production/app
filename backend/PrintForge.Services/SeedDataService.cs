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
        var adminEmail = cfg.AdminEmail?.Trim() ?? "";
        var adminPassword = cfg.AdminPassword?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(adminPassword))
        {
            logger.LogWarning(
                "AdminPassword is not set — bootstrap admin was NOT created. " +
                "Set AdminEmail and AdminPassword on Render, then redeploy.");
        }
        else if (string.IsNullOrWhiteSpace(adminEmail))
        {
            logger.LogWarning("AdminEmail is not set — bootstrap admin was NOT created.");
        }
        else
        {
            await EnsureAdminUserAsync(adminEmail, adminPassword);
        }

        logger.LogInformation("Seed complete (RBAC only; catalog is empty until admin adds data)");
    }

    /// <summary>Creates or updates the bootstrap admin from Render env vars.</summary>
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
            logger.LogInformation("Bootstrap admin created for {Email}", normalized);
            return;
        }

        await users.UpdateAsync(existing.Id, new Dictionary<string, object?>
        {
            ["password_hash"] = PasswordHasher.Hash(password),
            ["role"] = "admin"
        });
        logger.LogInformation("Bootstrap admin password synced for {Email}", normalized);
    }
}

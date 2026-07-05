using Microsoft.Extensions.Options;
using PrintForge.Infrastructure.Auth;
using PrintForge.Infrastructure.Configuration;
using PrintForge.Models;
using PrintForge.Models.DTOs;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services;

public class AuthService(
    IUserRepository users,
    IPasswordResetRepository resets,
    IEmailService email) : IAuthService
{
    public async Task<UserDto> RegisterAsync(RegisterRequest request)
    {
        var emailNorm = request.Email.ToLowerInvariant().Trim();
        if (await users.FindByEmailAsync(emailNorm) is not null)
            throw new InvalidOperationException("Email already registered");

        var user = new User
        {
            Id = IdHelper.NewId(),
            Email = emailNorm,
            PasswordHash = PasswordHasher.Hash(request.Password),
            Name = request.Name.Trim(),
            Phone = request.Phone,
            Role = "customer",
            EmailVerified = false,
            CreatedAt = IdHelper.NowIso()
        };
        await users.InsertAsync(user);
        await email.SendAsync(emailNorm, "welcome", new Dictionary<string, object?> { ["name"] = user.Name });
        return UserMapper.ToDto(user);
    }

    public async Task<UserDto> LoginAsync(LoginRequest request)
    {
        var emailNorm = request.Email.ToLowerInvariant().Trim();
        var user = await users.FindByEmailAsync(emailNorm);
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password");
        return UserMapper.ToDto(user);
    }

    public async Task<UserDto?> GetMeAsync(string userId)
    {
        var user = await users.FindByIdAsync(userId);
        return user is null ? null : UserMapper.ToDto(user);
    }

    public Task RefreshAsync(string refreshToken)
    {
        // Token validation handled in controller; this is a no-op placeholder.
        return Task.CompletedTask;
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email.ToLowerInvariant());
        if (user is null) return;

        var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');
        await resets.InsertAsync(new PasswordReset
        {
            Id = IdHelper.NewId(),
            Token = token,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(1).ToString("O"),
            Used = false,
            CreatedAt = IdHelper.NowIso()
        });
        await email.SendAsync(user.Email, "reset_password", new Dictionary<string, object?> { ["link"] = $"/reset-password?token={token}" });
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var doc = await resets.FindValidTokenAsync(request.Token)
            ?? throw new InvalidOperationException("Invalid or used token");

        if (DateTime.Parse(doc.ExpiresAt) < DateTime.UtcNow)
            throw new InvalidOperationException("Token expired");

        await users.UpdateAsync(doc.UserId, new Dictionary<string, object?> { ["password_hash"] = PasswordHasher.Hash(request.Password) });
        await resets.MarkUsedAsync(doc.Id);
    }

    public async Task<UserDto> UpdateProfileAsync(string userId, ProfileUpdateRequest request)
    {
        var updates = new Dictionary<string, object?>();
        if (request.Name is not null) updates["name"] = request.Name;
        if (request.Phone is not null) updates["phone"] = request.Phone;
        if (request.AvatarUrl is not null) updates["avatar_url"] = request.AvatarUrl;

        if (updates.Count > 0) await users.UpdateAsync(userId, updates);
        var user = await users.FindByIdAsync(userId) ?? throw new KeyNotFoundException("User not found");
        return UserMapper.ToDto(user);
    }
}

public class CouponService(ICouponRepository coupons) : ICouponService
{
    public async Task<CouponValidationResult> ValidateAsync(string code, double subtotal)
    {
        var c = await coupons.FindByCodeAsync(code)
            ?? throw new KeyNotFoundException("Invalid coupon");

        if (!string.IsNullOrEmpty(c.ExpiresAt) && DateTime.Parse(c.ExpiresAt) < DateTime.UtcNow)
            throw new InvalidOperationException("Coupon expired");

        if (subtotal < c.MinOrder)
            throw new InvalidOperationException($"Minimum order ₹{c.MinOrder} required");

        double discount = c.Kind == "percent"
            ? subtotal * (c.Value / 100)
            : c.Value;

        if (c.MaxDiscount.HasValue)
            discount = Math.Min(discount, c.MaxDiscount.Value);

        return new CouponValidationResult(BsonMapper.ToDict(c), Math.Round(discount, 2));
    }

    public async Task<List<Dictionary<string, object?>>> ListAsync()
    {
        var items = await coupons.ListAsync();
        return items.Select(BsonMapper.ToDict).ToList();
    }

    public async Task<Dictionary<string, object?>> CreateAsync(CouponRequest request)
    {
        var doc = new Coupon
        {
            Id = IdHelper.NewId(),
            Code = request.Code.ToUpperInvariant().Trim(),
            Kind = request.Kind,
            Value = request.Value,
            MinOrder = request.MinOrder,
            MaxDiscount = request.MaxDiscount,
            IsActive = request.IsActive,
            ExpiresAt = request.ExpiresAt,
            CreatedAt = IdHelper.NowIso()
        };
        await coupons.InsertAsync(doc);
        return BsonMapper.ToDict(doc);
    }

    public async Task DeleteAsync(string cid) => await coupons.DeleteAsync(cid);

    public async Task<Dictionary<string, object?>> UpdateAsync(string cid, Dictionary<string, object?> payload)
    {
        if (payload.TryGetValue("code", out var codeObj) && codeObj is string codeStr)
            payload["code"] = codeStr.ToUpperInvariant().Trim();

        await coupons.UpdateAsync(cid, payload);
        var updated = await coupons.FindByIdAsync(cid) ?? throw new KeyNotFoundException("Not found");
        return BsonMapper.ToDict(updated);
    }
}

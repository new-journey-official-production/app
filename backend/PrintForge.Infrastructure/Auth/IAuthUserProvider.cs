using PrintForge.Models.Entities;

namespace PrintForge.Infrastructure.Auth;

public interface IAuthUserProvider
{
    Task<User?> GetUserByIdAsync(string userId);
    Task<Dictionary<string, int>> GetPermissionsAsync(string userId);
}

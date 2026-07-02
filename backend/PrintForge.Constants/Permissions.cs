namespace PrintForge.Constants;

/// <summary>Bitmask permission flags — must match frontend CPPermissions enum.</summary>
[Flags]
public enum CPPermissions
{
    Delete = 1,
    Update = 2,
    Read = 4,
    Create = 8,
    Hidden = 16
}

public static class PermissionHelper
{
    public const int FullCrud = (int)(CPPermissions.Delete | CPPermissions.Update | CPPermissions.Read | CPPermissions.Create);

    /// <summary>Return true when userBits contains all requiredBits.</summary>
    public static bool HasPermission(int userBits, int requiredBits) => (userBits & requiredBits) == requiredBits;
}

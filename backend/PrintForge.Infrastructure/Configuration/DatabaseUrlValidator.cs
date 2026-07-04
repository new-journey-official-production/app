namespace PrintForge.Infrastructure.Configuration;

/// <summary>
/// Validates Supabase Postgres connection strings for cloud hosts that only support IPv4 (e.g. Render).
/// </summary>
public static class DatabaseUrlValidator
{
    /// <summary>
    /// Throws when Production uses Supabase direct host (IPv6-only), which Render cannot reach.
    /// </summary>
    public static void EnsureProductionCompatible(string? databaseUrl)
    {
        var isProduction = string.Equals(
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            "Production",
            StringComparison.OrdinalIgnoreCase);

        if (!isProduction || string.IsNullOrWhiteSpace(databaseUrl))
            return;

        var usesDirectSupabaseHost = databaseUrl.Contains("db.", StringComparison.OrdinalIgnoreCase)
            && databaseUrl.Contains("supabase.co", StringComparison.OrdinalIgnoreCase)
            && !databaseUrl.Contains("pooler.supabase.com", StringComparison.OrdinalIgnoreCase);

        if (!usesDirectSupabaseHost)
            return;

        throw new InvalidOperationException(
            "DatabaseUrl points at Supabase direct connection (db.*.supabase.co), which is IPv6-only. " +
            "Render cannot reach it (Network is unreachable). " +
            "In Supabase Dashboard → Connect → Session pooler, copy the .NET connection string " +
            "(host aws-0-*.pooler.supabase.com, username postgres.<project-ref>) and set it as DatabaseUrl on Render.");
    }
}

using System.Text.Json;

namespace PrintForge.Infrastructure.Configuration;

/// <summary>
/// Normalizes DatabaseUrl from env vars — handles accidental JSON pastes from Supabase or appsettings.
/// </summary>
public static class DatabaseUrlNormalizer
{
    private static readonly string[] JsonConnectionKeys =
    [
        "defaultconnection",
        "databaseurl",
        "connectionstring",
        "postgres",
    ];

    /// <summary>
    /// Returns an Npgsql-ready connection string. Extracts from JSON when Render env was pasted as appsettings.
    /// </summary>
    public static string Resolve(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return "";

        var trimmed = raw.Trim().Trim('"');

        if (!trimmed.StartsWith('{'))
            return trimmed;

        try
        {
            using var doc = JsonDocument.Parse(trimmed);
            var extracted = TryExtractFromJson(doc.RootElement);
            if (!string.IsNullOrWhiteSpace(extracted))
                return extracted.Trim();
        }
        catch (JsonException)
        {
            // Fall through to the explicit format error below.
        }

        throw new InvalidOperationException(
            "DatabaseUrl must be a single Npgsql connection string, not JSON. " +
            "On Render → Environment → DatabaseUrl, paste one line like: " +
            "Host=aws-0-REGION.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.PROJECT_REF;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true");
    }

    private static string? TryExtractFromJson(JsonElement root)
    {
        foreach (var property in root.EnumerateObject())
        {
            if (property.Value.ValueKind == JsonValueKind.String
                && JsonConnectionKeys.Contains(property.Name, StringComparer.OrdinalIgnoreCase))
            {
                return property.Value.GetString();
            }

            if (property.Value.ValueKind != JsonValueKind.Object)
                continue;

            foreach (var nested in property.Value.EnumerateObject())
            {
                if (nested.Value.ValueKind == JsonValueKind.String
                    && JsonConnectionKeys.Contains(nested.Name, StringComparer.OrdinalIgnoreCase))
                {
                    return nested.Value.GetString();
                }
            }
        }

        return null;
    }
}

using System.Text.Json;
using Dapper;

namespace PrintForge.Infrastructure.Database;

/// <summary>Builds parameterized UPDATE fragments from snake_case field dictionaries.</summary>
public static class PostgresSqlHelper
{
    private static readonly HashSet<string> JsonbColumns = new(StringComparer.Ordinal)
    {
        "color_variants", "images", "tags", "items", "address", "timeline", "messages", "metadata", "context", "meta",
        "colors", "customization", "gallery", "lifestyle_images", "white_bg_images", "transparent_images",
        "images_360", "videos", "faqs", "categories",
    };

    public static (string SetClause, DynamicParameters Parameters) BuildSetClause(
        Dictionary<string, object?> updates,
        DynamicParameters? parameters = null)
    {
        parameters ??= new DynamicParameters();
        var parts = new List<string>();
        var index = 0;

        foreach (var (key, value) in updates)
        {
            var paramName = $"p{index++}";

            if (JsonbColumns.Contains(key))
            {
                parts.Add($"{key} = @{paramName}::jsonb");
                parameters.Add(paramName, JsonSerializer.Serialize(value ?? Array.Empty<string>()));
                continue;
            }

            if (key is "updated_at" or "created_at")
            {
                parts.Add($"{key} = coalesce(nullif(@{paramName}, '')::timestamptz, now())");
                parameters.Add(paramName, value);
                continue;
            }

            parts.Add($"{key} = @{paramName}");
            parameters.Add(paramName, value);
        }

        return (string.Join(", ", parts), parameters);
    }
}

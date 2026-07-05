using System.Text.Json;

namespace PrintForge.Infrastructure.Database;

/// <summary>Converts API patch dictionaries (JsonElement values) into Postgres-friendly CLR types.</summary>
public static class PostgresPayloadNormalizer
{
    private static readonly HashSet<string> ProductImmutableFields = new(StringComparer.Ordinal)
    {
        "id", "rating_avg", "rating_count", "orders_count", "created_at",
    };

    private static readonly HashSet<string> ProductJsonArrayFields = new(StringComparer.Ordinal)
    {
        "color_variants", "images", "tags",
    };

    /// <summary>Removes read-only keys and unwraps JsonElement values for product PATCH.</summary>
    public static Dictionary<string, object?> SanitizeProductPatch(Dictionary<string, object?> payload)
    {
        var cleaned = new Dictionary<string, object?>(StringComparer.Ordinal);
        foreach (var (key, raw) in payload)
        {
            if (ProductImmutableFields.Contains(key)) continue;
            cleaned[key] = NormalizeField(key, Unwrap(raw));
        }
        return cleaned;
    }

    /// <summary>Recursively unwrap JsonElement to CLR primitives/lists/dicts.</summary>
    public static object? Unwrap(object? value)
    {
        if (value is not JsonElement el) return value;
        return el.ValueKind switch
        {
            JsonValueKind.Null or JsonValueKind.Undefined => null,
            JsonValueKind.String => el.GetString(),
            JsonValueKind.Number when el.TryGetInt64(out var l) => l,
            JsonValueKind.Number => el.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Array => el.EnumerateArray().Select(x => Unwrap(x)).ToList(),
            JsonValueKind.Object => el.EnumerateObject().ToDictionary(p => p.Name, p => Unwrap(p.Value)),
            _ => null,
        };
    }

    private static object? NormalizeField(string key, object? value)
    {
        if (value is null) return null;

        if (ProductJsonArrayFields.Contains(key))
            return ToStringList(value);

        if (key is "price" or "discount_price" or "weight_g" or "print_time_hours")
            return CoerceDouble(value);

        if (key is "stock" or "rating_count" or "orders_count")
            return CoerceInt(value);

        if (key is "featured" or "is_active")
            return CoerceBool(value);

        return value;
    }

    private static List<string> ToStringList(object? value)
    {
        if (value is IEnumerable<string> strings)
            return strings.Where(s => !string.IsNullOrWhiteSpace(s)).ToList();

        if (value is IEnumerable<object?> objects)
            return objects.Select(x => x?.ToString() ?? "").Where(s => s.Length > 0).ToList();

        return [];
    }

    private static double? CoerceDouble(object? value) => value switch
    {
        null => null,
        double d => d,
        float f => f,
        int i => i,
        long l => l,
        string s when double.TryParse(s, out var d) => d,
        JsonElement el when el.ValueKind == JsonValueKind.Number => el.GetDouble(),
        _ => null,
    };

    private static int? CoerceInt(object? value) => value switch
    {
        null => null,
        int i => i,
        long l => (int)l,
        double d => (int)d,
        string s when int.TryParse(s, out var i) => i,
        _ => null,
    };

    private static bool CoerceBool(object? value) => value switch
    {
        bool b => b,
        string s => s is "1" or "true" or "True" or "yes",
        int i => i != 0,
        long l => l != 0,
        double d => d != 0,
        _ => false,
    };
}

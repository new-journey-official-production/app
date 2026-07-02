namespace PrintForge.Models;

public static class IdHelper
{
    public static string NewId() => Guid.NewGuid().ToString();

    public static string NowIso() => DateTime.UtcNow.ToString("O");

    public static string Slugify(string text)
    {
        var s = System.Text.RegularExpressions.Regex.Replace(text.ToLowerInvariant(), @"[^a-zA-Z0-9\s-]", "").Trim();
        s = System.Text.RegularExpressions.Regex.Replace(s, @"[\s_-]+", "-");
        return string.IsNullOrEmpty(s) ? NewId()[..8] : s;
    }
}

public static class UserMapper
{
    public static DTOs.UserDto ToDto(Entities.User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        Phone = user.Phone,
        Role = user.Role,
        RoleId = user.RoleId,
        AvatarUrl = user.AvatarUrl,
        EmailVerified = user.EmailVerified,
        CreatedAt = user.CreatedAt
    };
}

public static class BsonMapper
{
    /// <summary>Convert entity to dictionary with snake_case keys matching Python MongoDB docs.</summary>
    public static Dictionary<string, object?> ToDict(object entity)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(entity);
        var doc = System.Text.Json.JsonDocument.Parse(json);
        return JsonElementToDict(doc.RootElement);
    }

    public static Dictionary<string, object?> JsonElementToDict(System.Text.Json.JsonElement el)
    {
        var dict = new Dictionary<string, object?>();
        foreach (var prop in el.EnumerateObject())
        {
            dict[ToSnakeCase(prop.Name)] = JsonElementToValue(prop.Value);
        }
        return dict;
    }

    private static object? JsonElementToValue(System.Text.Json.JsonElement el) => el.ValueKind switch
    {
        System.Text.Json.JsonValueKind.Object => JsonElementToDict(el),
        System.Text.Json.JsonValueKind.Array => el.EnumerateArray().Select(JsonElementToValue).ToList(),
        System.Text.Json.JsonValueKind.String => el.GetString(),
        System.Text.Json.JsonValueKind.Number when el.TryGetInt64(out var l) => l,
        System.Text.Json.JsonValueKind.Number => el.GetDouble(),
        System.Text.Json.JsonValueKind.True => true,
        System.Text.Json.JsonValueKind.False => false,
        _ => null
    };

    private static string ToSnakeCase(string name)
    {
        if (string.IsNullOrEmpty(name)) return name;
        var sb = new System.Text.StringBuilder();
        for (var i = 0; i < name.Length; i++)
        {
            var c = name[i];
            if (char.IsUpper(c))
            {
                if (i > 0) sb.Append('_');
                sb.Append(char.ToLowerInvariant(c));
            }
            else sb.Append(c);
        }
        return sb.ToString();
    }
}

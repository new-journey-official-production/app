using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Conventions;

namespace PrintForge.Infrastructure.Database;

/// <summary>Maps C# PascalCase properties to MongoDB snake_case element names.</summary>
public class SnakeCaseElementNameConvention : ConventionBase, IMemberMapConvention
{
    public void Apply(BsonMemberMap memberMap) =>
        memberMap.SetElementName(ToSnakeCase(memberMap.MemberName));

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

public static class MongoConventionSetup
{
    private static bool _registered;

    public static void Register()
    {
        if (_registered) return;
        _registered = true;
        ConventionRegistry.Register("snakeCase", new ConventionPack
        {
            new SnakeCaseElementNameConvention(),
            new IgnoreExtraElementsConvention(true)
        }, _ => true);
    }
}

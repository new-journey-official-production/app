using Dapper;

namespace PrintForge.Infrastructure.Database;

/// <summary>Builds parameterized UPDATE fragments from snake_case field dictionaries.</summary>
public static class PostgresSqlHelper
{
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
            parts.Add($"{key} = @{paramName}");
            parameters.Add(paramName, value);
        }

        return (string.Join(", ", parts), parameters);
    }
}

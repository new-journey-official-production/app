using System.Data;
using System.Text.Json;
using Dapper;
using Npgsql;
using NpgsqlTypes;

namespace PrintForge.Infrastructure.Database;

/// <summary>Dapper handlers for jsonb columns and CLR list types.</summary>
public static class PostgresTypeHandlers
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
    };

    public static void Register()
    {
        SqlMapper.AddTypeHandler(new JsonTypeHandler<List<string>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<Dictionary<string, object?>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<List<PrintForge.Models.Entities.OrderItem>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<List<PrintForge.Models.Entities.OrderTimelineEntry>>());
        SqlMapper.AddTypeHandler(new JsonTypeHandler<List<PrintForge.Models.Entities.TicketMessage>>());
        // EmbeddedAddress only — never register JsonTypeHandler on Address (breaks multi-column Dapper reads).
        SqlMapper.AddTypeHandler(new JsonTypeHandler<PrintForge.Models.Entities.EmbeddedAddress>());
    }

    private sealed class JsonTypeHandler<T> : SqlMapper.TypeHandler<T>
    {
        public override T? Parse(object value)
        {
            if (value is DBNull or null) return default;
            var json = value switch
            {
                string s => s,
                byte[] bytes => System.Text.Encoding.UTF8.GetString(bytes),
                _ => value.ToString() ?? "{}",
            };
            return JsonSerializer.Deserialize<T>(json, JsonOptions);
        }

        public override void SetValue(IDbDataParameter parameter, T? value)
        {
            parameter.Value = value is null ? DBNull.Value : JsonSerializer.Serialize(value, JsonOptions);

            // Npgsql defaults serialized JSON to text; jsonb columns require Jsonb db type or ::jsonb cast.
            if (parameter is NpgsqlParameter npgsql)
                npgsql.NpgsqlDbType = NpgsqlDbType.Jsonb;
        }
    }
}

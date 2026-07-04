using Dapper;
using Microsoft.Extensions.Options;
using Npgsql;
using PrintForge.Infrastructure.Configuration;

namespace PrintForge.Infrastructure.Database;

/// <summary>Opens Npgsql connections to Supabase Postgres.</summary>
public sealed class PostgresDb(IOptions<AppSettings> settings)
{
    static PostgresDb()
    {
        DefaultTypeMap.MatchNamesWithUnderscores = true;
        PostgresTypeHandlers.Register();
    }

    public string ConnectionString => settings.Value.DatabaseUrl;

    public NpgsqlConnection OpenConnection()
    {
        var connection = new NpgsqlConnection(ConnectionString);
        connection.Open();
        return connection;
    }

    public async Task<NpgsqlConnection> OpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
}

using System.Reflection;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace PrintForge.Infrastructure.Database;

/// <summary>
/// Applies embedded Supabase SQL migrations once per file (tracked in schema_migrations).
/// </summary>
public sealed partial class DatabaseMigrationRunner(PostgresDb db, ILogger<DatabaseMigrationRunner> logger)
{
    private const string MigrationTableSql = """
        create table if not exists schema_migrations (
          id text primary key,
          applied_at timestamptz not null default now()
        );
        """;

    /// <summary>Runs any migrations not yet recorded in schema_migrations.</summary>
    public async Task ApplyPendingAsync(CancellationToken cancellationToken = default)
    {
        await using var conn = await db.OpenConnectionAsync(cancellationToken);
        await ExecuteBatchAsync(conn, MigrationTableSql, cancellationToken);

        foreach (var migration in LoadEmbeddedMigrations())
        {
            if (await IsAppliedAsync(conn, migration.Id, cancellationToken))
            {
                logger.LogDebug("Migration already applied: {MigrationId}", migration.Id);
                continue;
            }

            logger.LogInformation("Applying database migration: {MigrationId}", migration.Id);
            await ExecuteBatchAsync(conn, migration.Sql, cancellationToken);
            await MarkAppliedAsync(conn, migration.Id, cancellationToken);
            logger.LogInformation("Applied database migration: {MigrationId}", migration.Id);
        }
    }

    private static IReadOnlyList<EmbeddedMigration> LoadEmbeddedMigrations()
    {
        var assembly = typeof(DatabaseMigrationRunner).Assembly;
        return assembly.GetManifestResourceNames()
            .Where(name => name.EndsWith(".sql", StringComparison.OrdinalIgnoreCase))
            .OrderBy(name => name, StringComparer.Ordinal)
            .Select(name =>
            {
                using var stream = assembly.GetManifestResourceStream(name)
                    ?? throw new InvalidOperationException($"Missing embedded migration resource: {name}");
                using var reader = new StreamReader(stream);
                var sql = reader.ReadToEnd();
                var fileName = name.Split('.')[^2] + ".sql";
                // Resource: PrintForge.Infrastructure.Migrations.20260702000000_rbac_schema.sql
                var id = ExtractMigrationId(name);
                return new EmbeddedMigration(id, sql);
            })
            .ToList();
    }

    private static string ExtractMigrationId(string resourceName)
    {
        var match = MigrationIdPattern().Match(resourceName);
        return match.Success ? match.Groups[1].Value : resourceName;
    }

    private static async Task<bool> IsAppliedAsync(
        NpgsqlConnection conn,
        string migrationId,
        CancellationToken cancellationToken)
    {
        await using var cmd = new NpgsqlCommand(
            "select exists(select 1 from schema_migrations where id = @id)",
            conn);
        cmd.Parameters.AddWithValue("id", migrationId);
        var result = await cmd.ExecuteScalarAsync(cancellationToken);
        return result is true;
    }

    private static async Task MarkAppliedAsync(
        NpgsqlConnection conn,
        string migrationId,
        CancellationToken cancellationToken)
    {
        await using var cmd = new NpgsqlCommand(
            "insert into schema_migrations (id) values (@id) on conflict (id) do nothing",
            conn);
        cmd.Parameters.AddWithValue("id", migrationId);
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task ExecuteBatchAsync(
        NpgsqlConnection conn,
        string sql,
        CancellationToken cancellationToken)
    {
        await using var tx = await conn.BeginTransactionAsync(cancellationToken);
        try
        {
            foreach (var statement in SplitSqlStatements(sql))
            {
                await using var cmd = new NpgsqlCommand(statement, conn, tx);
                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await tx.CommitAsync(cancellationToken);
        }
        catch
        {
            await tx.RollbackAsync(cancellationToken);
            throw;
        }
    }

    /// <summary>Splits DDL scripts on semicolons while skipping line comments.</summary>
    internal static IEnumerable<string> SplitSqlStatements(string sql)
    {
        var withoutComments = string.Join(
            '\n',
            sql.Split('\n').Where(line => !line.TrimStart().StartsWith("--", StringComparison.Ordinal)));

        return withoutComments
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(statement => statement.Length > 0);
    }

    [GeneratedRegex(@"\.(\d{8,}_[^.]+)\.sql$", RegexOptions.CultureInvariant)]
    private static partial Regex MigrationIdPattern();

    private sealed record EmbeddedMigration(string Id, string Sql);
}

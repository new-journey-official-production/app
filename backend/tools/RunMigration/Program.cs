using Npgsql;

var migrationPath = Path.GetFullPath(Path.Combine(
    AppContext.BaseDirectory,
    "..", "..", "..", "..", "..", "..", "supabase", "migrations", "20260704100000_app_schema.sql"));

if (!File.Exists(migrationPath))
{
    migrationPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(),
        "..", "..", "..", "supabase", "migrations", "20260704100000_app_schema.sql"));
}

var connStr = args.Length > 0
    ? args[0]
    : Environment.GetEnvironmentVariable("DatabaseUrl")
      ?? throw new InvalidOperationException("Pass connection string or set DatabaseUrl env var.");

if (!File.Exists(migrationPath))
    throw new FileNotFoundException("Migration file not found", migrationPath);

var sql = await File.ReadAllTextAsync(migrationPath);
await using var conn = new NpgsqlConnection(connStr);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand(sql, conn);
await cmd.ExecuteNonQueryAsync();
Console.WriteLine($"Migration applied: {Path.GetFileName(migrationPath)}");

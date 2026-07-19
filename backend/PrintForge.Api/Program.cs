using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using PrintForge.Constants;
using PrintForge.Infrastructure.Configuration;
using PrintForge.Infrastructure.Database;
using PrintForge.Infrastructure.Extensions;
using PrintForge.Infrastructure.Middleware;
using PrintForge.Services.Extensions;
using PrintForge.Services.Interfaces;

// CreateEmptyBuilder avoids default appsettings FileSystemWatchers.
// Render's shared containers hit the Linux inotify limit (128) and crash if
// WebApplication.CreateBuilder registers reloadOnChange watchers.
var builder = WebApplication.CreateEmptyBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
});

var envName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
    ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
    ?? "Production";

builder.Configuration
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: false)
    .AddJsonFile($"appsettings.{envName}.json", optional: true, reloadOnChange: false)
    .AddEnvironmentVariables()
    .AddCommandLine(args);

builder.Logging.AddConsole();
builder.WebHost.UseKestrel();

// Render injects PORT; bind Kestrel so health checks and traffic reach the container.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
else
    builder.WebHost.UseUrls("http://0.0.0.0:8080");

builder.Services.Configure<AppSettings>(builder.Configuration);
builder.Services.AddPrintForgeInfrastructure();
builder.Services.AddPrintForgeServices();

var jwtSecret = builder.Configuration["JwtSecret"] ?? "change-me-in-production-use-long-secret";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue(BackendConstants.AccessTokenCookie, out var cookieToken))
                    context.Token = cookieToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddRouting();
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
        o.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
    });

// Cookie auth requires AllowCredentials — never use AllowAnyOrigin with withCredentials.
var configuredOrigins = (builder.Configuration["CorsOrigins"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
var defaultOrigins = new[]
{
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:30000",
    "https://store.newjourneyofficial.com",
    "https://nj-store-tan.vercel.app",
};
var corsOrigins = (configuredOrigins.Contains("*") || configuredOrigins.Length == 0
    ? defaultOrigins
    : configuredOrigins.Concat(defaultOrigins))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ContextMiddleware>();
app.UseMiddleware<PermissionMiddleware>();
app.MapControllers();

var databaseUrl = DatabaseUrlNormalizer.Resolve(builder.Configuration["DatabaseUrl"]);
DatabaseUrlValidator.EnsureProductionCompatible(databaseUrl);

using (var scope = app.Services.CreateScope())
{
    var migrator = scope.ServiceProvider.GetRequiredService<DatabaseMigrationRunner>();
    await migrator.ApplyPendingAsync();

    var seed = scope.ServiceProvider.GetRequiredService<ISeedDataService>();
    await seed.SeedAsync();
}

app.Run();

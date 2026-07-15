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

// Disable config file watchers before host construction — Render free/shared
// containers exhaust the inotify instance limit (128) and crash at startup.
Environment.SetEnvironmentVariable("DOTNET_HOSTBUILDER_RELOADCONFIGONCHANGE", "false");

var builder = WebApplication.CreateBuilder(args);

// Render injects PORT; bind Kestrel so health checks and traffic reach the container.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

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
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
        o.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower;
    });

var corsOrigins = (builder.Configuration["CorsOrigins"] ?? "*").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (corsOrigins.Contains("*"))
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        else
            policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
    });
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

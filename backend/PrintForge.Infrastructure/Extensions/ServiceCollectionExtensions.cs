using Microsoft.Extensions.DependencyInjection;
using PrintForge.Infrastructure.Auth;
using PrintForge.Infrastructure.Configuration;
using PrintForge.Infrastructure.Database;
using PrintForge.Infrastructure.Supabase;

namespace PrintForge.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPrintForgeInfrastructure(this IServiceCollection services)
    {
        services.AddHttpClient();
        services.AddSingleton<SupabaseHealthService>();
        services.AddSingleton<PostgresDb>();
        services.AddSingleton<JwtService>();
        return services;
    }
}

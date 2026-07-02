using Microsoft.Extensions.DependencyInjection;
using PrintForge.Infrastructure.Auth;
using PrintForge.Infrastructure.Configuration;
using PrintForge.Infrastructure.Database;

namespace PrintForge.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPrintForgeInfrastructure(this IServiceCollection services)
    {
        MongoConventionSetup.Register();
        services.AddSingleton<MongoDbContext>();
        services.AddSingleton<JwtService>();
        return services;
    }
}

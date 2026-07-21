using Microsoft.Extensions.DependencyInjection;
using PrintForge.Infrastructure.Auth;
using PrintForge.Repositories;
using PrintForge.Repositories.Interfaces;
using PrintForge.Services.Interfaces;

namespace PrintForge.Services.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPrintForgeServices(this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IStorefrontSettingsRepository, StorefrontSettingsRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IWishlistRepository, WishlistRepository>();
        services.AddScoped<IAddressRepository, AddressRepository>();
        services.AddScoped<ICouponRepository, CouponRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IInventoryRepository, InventoryRepository>();
        services.AddScoped<IPrinterRepository, PrinterRepository>();
        services.AddScoped<ITicketRepository, TicketRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IBlogRepository, BlogRepository>();
        services.AddScoped<IMediaRepository, MediaRepository>();
        services.AddScoped<IActivityLogRepository, ActivityLogRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<IPaymentConfigurationRepository, PaymentConfigurationRepository>();
        services.AddScoped<IPasswordResetRepository, PasswordResetRepository>();
        services.AddScoped<IRbacRepository, RbacRepository>();
        services.AddScoped<IEmailLogRepository, EmailLogRepository>();
        services.AddScoped<INewsletterRepository, NewsletterRepository>();
        services.AddScoped<IContactRepository, ContactRepository>();
        services.AddScoped<IB2bCategoryRepository, B2bCategoryRepository>();
        services.AddScoped<IB2bProductRepository, B2bProductRepository>();
        services.AddScoped<IB2bQuoteRepository, B2bQuoteRepository>();
        services.AddScoped<IB2bDealerRepository, B2bDealerRepository>();
        services.AddScoped<IB2bAnalyticsRepository, B2bAnalyticsRepository>();
        services.AddScoped<IB2bSettingsRepository, B2bSettingsRepository>();
        services.AddScoped<IFinanceRepository, FinanceRepository>();

        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<IAuthUserProvider, AuthUserProvider>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IPaymentConfigurationService, PaymentConfigurationService>();
        services.AddScoped<IBillingService, BillingService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ICouponService, CouponService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IMediaService, MediaService>();
        services.AddScoped<IRbacService, RbacService>();
        services.AddScoped<ISeedDataService, SeedDataService>();
        services.AddScoped<IB2bService, B2bService>();
        services.AddScoped<IFinanceService, FinanceService>();

        return services;
    }
}

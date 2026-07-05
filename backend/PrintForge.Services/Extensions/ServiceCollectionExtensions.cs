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
        services.AddScoped<IPasswordResetRepository, PasswordResetRepository>();
        services.AddScoped<IRbacRepository, RbacRepository>();
        services.AddScoped<IEmailLogRepository, EmailLogRepository>();
        services.AddScoped<INewsletterRepository, NewsletterRepository>();
        services.AddScoped<IContactRepository, ContactRepository>();

        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<IAuthUserProvider, AuthUserProvider>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IBillingService, BillingService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ICouponService, CouponService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<IMediaService, MediaService>();
        services.AddScoped<IRbacService, RbacService>();
        services.AddScoped<ISeedDataService, SeedDataService>();

        return services;
    }
}

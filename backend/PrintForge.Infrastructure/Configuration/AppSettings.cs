namespace PrintForge.Infrastructure.Configuration;

public class AppSettings
{
    public string DatabaseUrl { get; set; } = "";
    public string JwtSecret { get; set; } = "change-me-in-production-use-long-secret";
    public string CorsOrigins { get; set; } = "*";
    public string AdminEmail { get; set; } = "admin@newjourney.com";
    public string AdminPassword { get; set; } = "Admin@12345";
    public string DemoCustomerEmail { get; set; } = "customer@newjourney.com";
    public string DemoCustomerPassword { get; set; } = "Customer@12345";
    public string SupabaseUrl { get; set; } = "";
    public string SupabasePublishableKey { get; set; } = "";
}

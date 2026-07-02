namespace PrintForge.Infrastructure.Configuration;

public class AppSettings
{
    public string MongoUrl { get; set; } = "mongodb://localhost:27017";
    public string DbName { get; set; } = "newjourney";
    public string JwtSecret { get; set; } = "change-me-in-production-use-long-secret";
    public string CorsOrigins { get; set; } = "*";
    public string AdminEmail { get; set; } = "admin@newjourney.com";
    public string AdminPassword { get; set; } = "Admin@12345";
    public string DemoCustomerEmail { get; set; } = "customer@newjourney.com";
    public string DemoCustomerPassword { get; set; } = "Customer@12345";
}

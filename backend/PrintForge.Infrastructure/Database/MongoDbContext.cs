using Microsoft.Extensions.Options;
using MongoDB.Driver;
using PrintForge.Infrastructure.Configuration;
using PrintForge.Models.Entities;

namespace PrintForge.Infrastructure.Database;

/// <summary>MongoDB database context exposing typed collections matching Python backend.</summary>
public class MongoDbContext
{
    public IMongoDatabase Database { get; }

    public MongoDbContext(IOptions<AppSettings> settings)
    {
        var client = new MongoClient(settings.Value.MongoUrl);
        Database = client.GetDatabase(settings.Value.DbName);
    }

    public IMongoCollection<T> Collection<T>(string name) => Database.GetCollection<T>(name);

    public IMongoCollection<User> Users => Collection<User>("users");
    public IMongoCollection<Category> Categories => Collection<Category>("categories");
    public IMongoCollection<Product> Products => Collection<Product>("products");
    public IMongoCollection<Review> Reviews => Collection<Review>("reviews");
    public IMongoCollection<WishlistItem> Wishlist => Collection<WishlistItem>("wishlist");
    public IMongoCollection<Address> Addresses => Collection<Address>("addresses");
    public IMongoCollection<Coupon> Coupons => Collection<Coupon>("coupons");
    public IMongoCollection<Order> Orders => Collection<Order>("orders");
    public IMongoCollection<InventoryItem> Inventory => Collection<InventoryItem>("inventory");
    public IMongoCollection<Printer> Printers => Collection<Printer>("printers");
    public IMongoCollection<Ticket> Tickets => Collection<Ticket>("tickets");
    public IMongoCollection<Notification> Notifications => Collection<Notification>("notifications");
    public IMongoCollection<BlogPost> Blog => Collection<BlogPost>("blog");
    public IMongoCollection<MediaItem> Media => Collection<MediaItem>("media");
    public IMongoCollection<ActivityLog> ActivityLogs => Collection<ActivityLog>("activity_logs");
    public IMongoCollection<Payment> Payments => Collection<Payment>("payments");
    public IMongoCollection<PasswordReset> PasswordResets => Collection<PasswordReset>("password_resets");
    public IMongoCollection<ModuleEntity> Modules => Collection<ModuleEntity>("modules");
    public IMongoCollection<Role> Roles => Collection<Role>("roles");
    public IMongoCollection<RolePermission> RolePermissions => Collection<RolePermission>("role_permissions");
    public IMongoCollection<UserPermission> UserPermissions => Collection<UserPermission>("user_permissions");
    public IMongoCollection<EmailLog> EmailLog => Collection<EmailLog>("email_log");
    public IMongoCollection<NewsletterSubscriber> Newsletter => Collection<NewsletterSubscriber>("newsletter");
    public IMongoCollection<ContactMessage> ContactMessages => Collection<ContactMessage>("contact_messages");
}

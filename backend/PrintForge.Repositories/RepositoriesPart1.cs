using MongoDB.Driver;
using PrintForge.Infrastructure.Database;
using PrintForge.Models.Entities;
using PrintForge.Repositories.Interfaces;

namespace PrintForge.Repositories;

public class UserRepository(MongoDbContext db) : IUserRepository
{
    public async Task<User?> FindByIdAsync(string id) =>
        await db.Users.Find(Builders<User>.Filter.Eq(u => u.Id, id)).FirstOrDefaultAsync();

    public async Task<User?> FindByEmailAsync(string email) =>
        await db.Users.Find(Builders<User>.Filter.Eq(u => u.Email, email)).FirstOrDefaultAsync();

    public async Task InsertAsync(User user) => await db.Users.InsertOneAsync(user);

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        var filter = Builders<User>.Filter.Eq(u => u.Id, id);
        var update = Builders<User>.Update.Combine(
            updates.Select(kv => Builders<User>.Update.Set(kv.Key, kv.Value)));
        await db.Users.UpdateOneAsync(filter, update);
    }

    public async Task<List<User>> FindCustomersAsync(int limit = 1000) =>
        await db.Users.Find(Builders<User>.Filter.Eq(u => u.Role, "customer"))
            .Limit(limit).ToListAsync();

    public async Task<List<User>> FindAllForAdminAsync(int limit = 500) =>
        await db.Users.Find(FilterDefinition<User>.Empty)
            .SortByDescending(u => u.CreatedAt)
            .Limit(limit)
            .ToListAsync();

    public async Task UpdateManyByRoleAsync(string role, string roleId) =>
        await db.Users.UpdateManyAsync(
            Builders<User>.Filter.Eq(u => u.Role, role) & Builders<User>.Filter.Exists(u => u.RoleId, false),
            Builders<User>.Update.Set(u => u.RoleId, roleId));

    public async Task<long> CountCustomersAsync() =>
        await db.Users.CountDocumentsAsync(Builders<User>.Filter.Eq(u => u.Role, "customer"));
}

public class CategoryRepository(MongoDbContext db) : ICategoryRepository
{
    public async Task<List<Category>> ListAsync() =>
        await db.Categories.Find(FilterDefinition<Category>.Empty).SortBy(c => c.Name).ToListAsync();

    public async Task<long> CountAsync() =>
        await db.Categories.CountDocumentsAsync(FilterDefinition<Category>.Empty);

    public async Task InsertManyAsync(IEnumerable<Category> categories) =>
        await db.Categories.InsertManyAsync(categories);
}

public class ProductRepository(MongoDbContext db) : IProductRepository
{
    public async Task<(List<Product> Items, long Total)> ListAsync(ProductQuery q)
    {
        var filter = Builders<Product>.Filter.Empty;
        if (q.ActiveOnly) filter &= Builders<Product>.Filter.Eq(p => p.IsActive, true);
        if (!string.IsNullOrEmpty(q.Category)) filter &= Builders<Product>.Filter.Eq(p => p.CategorySlug, q.Category);
        if (!string.IsNullOrEmpty(q.Material)) filter &= Builders<Product>.Filter.Eq(p => p.Material, q.Material);
        if (q.Featured.HasValue) filter &= Builders<Product>.Filter.Eq(p => p.Featured, q.Featured.Value);
        if (!string.IsNullOrEmpty(q.Query))
        {
            var regex = new MongoDB.Bson.BsonRegularExpression(q.Query, "i");
            filter &= Builders<Product>.Filter.Or(
                Builders<Product>.Filter.Regex(p => p.Name, regex),
                Builders<Product>.Filter.Regex(p => p.Description, regex),
                Builders<Product>.Filter.AnyEq(p => p.Tags, q.Query.ToLowerInvariant()));
        }
        if (q.MinPrice.HasValue) filter &= Builders<Product>.Filter.Gte(p => p.Price, q.MinPrice.Value);
        if (q.MaxPrice.HasValue) filter &= Builders<Product>.Filter.Lte(p => p.Price, q.MaxPrice.Value);

        var total = await db.Products.CountDocumentsAsync(filter);
        var find = db.Products.Find(filter);
        find = q.Sort switch
        {
            "price_asc" => find.SortBy(p => p.Price),
            "price_desc" => find.SortByDescending(p => p.Price),
            "rating" => find.SortByDescending(p => p.RatingAvg),
            "popular" => find.SortByDescending(p => p.OrdersCount),
            "newest" => find.SortByDescending(p => p.CreatedAt),
            _ => find.SortByDescending(p => p.CreatedAt)
        };
        var items = await find.Skip(q.Skip).Limit(q.Limit).ToListAsync();
        return (items, total);
    }

    public async Task<Product?> FindBySlugOrIdAsync(string slugOrId) =>
        await db.Products.Find(Builders<Product>.Filter.Or(
            Builders<Product>.Filter.Eq(p => p.Slug, slugOrId),
            Builders<Product>.Filter.Eq(p => p.Id, slugOrId))).FirstOrDefaultAsync();

    public async Task<Product?> FindByIdAsync(string id) =>
        await db.Products.Find(Builders<Product>.Filter.Eq(p => p.Id, id)).FirstOrDefaultAsync();

    public async Task<Product?> FindBySlugAsync(string slug) =>
        await db.Products.Find(Builders<Product>.Filter.Eq(p => p.Slug, slug)).FirstOrDefaultAsync();

    public async Task InsertAsync(Product product) => await db.Products.InsertOneAsync(product);

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        var filter = Builders<Product>.Filter.Eq(p => p.Id, id);
        var update = Builders<Product>.Update.Combine(
            updates.Select(kv => Builders<Product>.Update.Set(kv.Key, kv.Value)));
        await db.Products.UpdateOneAsync(filter, update);
    }

    public async Task DeleteAsync(string id) =>
        await db.Products.DeleteOneAsync(Builders<Product>.Filter.Eq(p => p.Id, id));

    public async Task<List<Product>> FindByIdsAsync(IEnumerable<string> ids) =>
        await db.Products.Find(Builders<Product>.Filter.In(p => p.Id, ids)).ToListAsync();

    public async Task<List<Product>> FindRelatedAsync(string categorySlug, string excludeId, int limit = 6) =>
        await db.Products.Find(
            Builders<Product>.Filter.Eq(p => p.CategorySlug, categorySlug) &
            Builders<Product>.Filter.Ne(p => p.Id, excludeId) &
            Builders<Product>.Filter.Eq(p => p.IsActive, true)).Limit(limit).ToListAsync();

    public async Task<List<Product>> ListAllAsync(int limit = 5000) =>
        await db.Products.Find(FilterDefinition<Product>.Empty).Limit(limit).ToListAsync();

    public async Task IncrementStockAsync(string productId, int delta, int orderDelta = 0) =>
        await db.Products.UpdateOneAsync(
            Builders<Product>.Filter.Eq(p => p.Id, productId),
            Builders<Product>.Update.Inc(p => p.Stock, delta).Inc(p => p.OrdersCount, orderDelta));
}

public class ReviewRepository(MongoDbContext db) : IReviewRepository
{
    public async Task InsertAsync(Review review) => await db.Reviews.InsertOneAsync(review);

    public async Task<List<Review>> FindByProductAsync(string productId, bool approvedOnly = true)
    {
        var filter = Builders<Review>.Filter.Eq(r => r.ProductId, productId);
        if (approvedOnly) filter &= Builders<Review>.Filter.Eq(r => r.Approved, true);
        return await db.Reviews.Find(filter).SortByDescending(r => r.CreatedAt).Limit(50).ToListAsync();
    }

    public async Task<List<Review>> ListAllAsync(int limit = 200) =>
        await db.Reviews.Find(FilterDefinition<Review>.Empty).SortByDescending(r => r.CreatedAt).Limit(limit).ToListAsync();

    public async Task UpdateAsync(string id, Dictionary<string, object?> updates)
    {
        var filter = Builders<Review>.Filter.Eq(r => r.Id, id);
        var update = Builders<Review>.Update.Combine(
            updates.Select(kv => Builders<Review>.Update.Set(kv.Key, kv.Value)));
        await db.Reviews.UpdateOneAsync(filter, update);
    }

    public async Task<List<Review>> FindApprovedByProductAsync(string productId) =>
        await db.Reviews.Find(
            Builders<Review>.Filter.Eq(r => r.ProductId, productId) &
            Builders<Review>.Filter.Eq(r => r.Approved, true)).ToListAsync();
}

public class WishlistRepository(MongoDbContext db) : IWishlistRepository
{
    public async Task<List<WishlistItem>> FindByUserAsync(string userId) =>
        await db.Wishlist.Find(Builders<WishlistItem>.Filter.Eq(w => w.UserId, userId)).ToListAsync();

    public async Task<bool> ExistsAsync(string userId, string productId) =>
        await db.Wishlist.Find(
            Builders<WishlistItem>.Filter.Eq(w => w.UserId, userId) &
            Builders<WishlistItem>.Filter.Eq(w => w.ProductId, productId)).AnyAsync();

    public async Task InsertAsync(WishlistItem item) => await db.Wishlist.InsertOneAsync(item);

    public async Task DeleteAsync(string userId, string productId) =>
        await db.Wishlist.DeleteOneAsync(
            Builders<WishlistItem>.Filter.Eq(w => w.UserId, userId) &
            Builders<WishlistItem>.Filter.Eq(w => w.ProductId, productId));
}

public class AddressRepository(MongoDbContext db) : IAddressRepository
{
    public async Task<List<Address>> FindByUserAsync(string userId) =>
        await db.Addresses.Find(Builders<Address>.Filter.Eq(a => a.UserId, userId)).Limit(50).ToListAsync();

    public async Task<Address?> FindByIdAndUserAsync(string id, string userId) =>
        await db.Addresses.Find(
            Builders<Address>.Filter.Eq(a => a.Id, id) &
            Builders<Address>.Filter.Eq(a => a.UserId, userId)).FirstOrDefaultAsync();

    public async Task InsertAsync(Address address) => await db.Addresses.InsertOneAsync(address);

    public async Task UpdateAsync(string id, string userId, Dictionary<string, object?> updates)
    {
        var filter = Builders<Address>.Filter.Eq(a => a.Id, id) & Builders<Address>.Filter.Eq(a => a.UserId, userId);
        var update = Builders<Address>.Update.Combine(
            updates.Select(kv => Builders<Address>.Update.Set(kv.Key, kv.Value)));
        await db.Addresses.UpdateOneAsync(filter, update);
    }

    public async Task ClearDefaultAsync(string userId) =>
        await db.Addresses.UpdateManyAsync(
            Builders<Address>.Filter.Eq(a => a.UserId, userId),
            Builders<Address>.Update.Set(a => a.IsDefault, false));

    public async Task DeleteAsync(string id, string userId) =>
        await db.Addresses.DeleteOneAsync(
            Builders<Address>.Filter.Eq(a => a.Id, id) &
            Builders<Address>.Filter.Eq(a => a.UserId, userId));
}

public class CouponRepository(MongoDbContext db) : ICouponRepository
{
    public async Task<Coupon?> FindByCodeAsync(string code) =>
        await db.Coupons.Find(
            Builders<Coupon>.Filter.Eq(c => c.Code, code.ToUpperInvariant()) &
            Builders<Coupon>.Filter.Eq(c => c.IsActive, true)).FirstOrDefaultAsync();

    public async Task<List<Coupon>> ListAsync() =>
        await db.Coupons.Find(FilterDefinition<Coupon>.Empty).SortBy(c => c.Code).Limit(200).ToListAsync();

    public async Task InsertAsync(Coupon coupon) => await db.Coupons.InsertOneAsync(coupon);

    public async Task DeleteAsync(string id) =>
        await db.Coupons.DeleteOneAsync(Builders<Coupon>.Filter.Eq(c => c.Id, id));

    public async Task<long> CountAsync() =>
        await db.Coupons.CountDocumentsAsync(FilterDefinition<Coupon>.Empty);

    public async Task InsertManyAsync(IEnumerable<Coupon> coupons) =>
        await db.Coupons.InsertManyAsync(coupons);
}

using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Infrastructure.Configurations;

namespace Sonirama.Api.Infrastructure;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetRequest> PasswordResetRequests => Set<PasswordResetRequest>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<BulkDiscount> BulkDiscounts => Set<BulkDiscount>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CategoryRelation> CategoryRelations => Set<CategoryRelation>();
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new PasswordResetRequestConfiguration());
        modelBuilder.ApplyConfiguration(new ProductConfiguration());
        modelBuilder.ApplyConfiguration(new BulkDiscountConfiguration());
        modelBuilder.ApplyConfiguration(new CategoryConfiguration());
        modelBuilder.ApplyConfiguration(new CategoryRelationConfiguration());
        modelBuilder.ApplyConfiguration(new ProductCategoryConfiguration());
    modelBuilder.ApplyConfiguration(new CartConfiguration());
    modelBuilder.ApplyConfiguration(new CartItemConfiguration());
    modelBuilder.ApplyConfiguration(new ProductImageConfiguration());
    modelBuilder.ApplyConfiguration(new OrderConfiguration());
    modelBuilder.ApplyConfiguration(new OrderItemConfiguration());

        modelBuilder.Entity<RefreshToken>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Token).IsRequired();
            b.HasIndex(x => x.Token).IsUnique();
            b.Property(x => x.ExpiresAtUtc).IsRequired();
        });
    }
}


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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new PasswordResetRequestConfiguration());
        modelBuilder.ApplyConfiguration(new ProductConfiguration());
        modelBuilder.ApplyConfiguration(new BulkDiscountConfiguration());

        modelBuilder.Entity<RefreshToken>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Token).IsRequired();
            b.HasIndex(x => x.Token).IsUnique();
            b.Property(x => x.ExpiresAtUtc).IsRequired();
        });
    }
}


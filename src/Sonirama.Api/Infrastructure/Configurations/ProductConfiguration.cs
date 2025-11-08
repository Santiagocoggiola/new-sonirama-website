using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Configurations;

// EF Core configuration for Product entity with constraints and indexes.
public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> b)
    {
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Code).IsRequired().HasMaxLength(64);
        b.Property(x => x.Name).IsRequired().HasMaxLength(200);
        b.Property(x => x.Description).HasMaxLength(2000);
        b.Property(x => x.Price).HasPrecision(18, 2);
        b.Property(x => x.Currency).IsRequired().HasMaxLength(3);
        b.Property(x => x.StockQuantity).IsRequired();
        b.Property(x => x.Category).HasMaxLength(100);
        b.Property(x => x.MinBulkQuantity);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedAtUtc).IsRequired();
        b.Property(x => x.UpdatedAtUtc);

        b.HasMany(x => x.BulkDiscounts)
            .WithOne(d => d.Product)
            .HasForeignKey(d => d.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

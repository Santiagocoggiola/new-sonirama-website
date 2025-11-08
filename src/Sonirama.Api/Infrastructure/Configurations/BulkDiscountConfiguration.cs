using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Configurations;

// EF Core configuration for BulkDiscount entity with constraints and indexes.
public sealed class BulkDiscountConfiguration : IEntityTypeConfiguration<BulkDiscount>
{
    public void Configure(EntityTypeBuilder<BulkDiscount> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.MinQuantity).IsRequired();
        b.Property(x => x.DiscountPercent).HasPrecision(5, 2);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedAtUtc).IsRequired();
        b.Property(x => x.UpdatedAtUtc);

        b.HasIndex(x => new { x.ProductId, x.IsActive, x.MinQuantity });

        b.HasOne(x => x.Product)
            .WithMany(p => p.BulkDiscounts)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Configurations;

public sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.ProductCode).IsRequired().HasMaxLength(64);
        b.Property(x => x.ProductName).IsRequired().HasMaxLength(200);
        b.Property(x => x.Quantity).IsRequired();
        b.Property(x => x.UnitPrice).HasPrecision(18, 2);
        b.Property(x => x.UnitPriceWithDiscount).HasPrecision(18, 2);
        b.Property(x => x.LineTotal).HasPrecision(18, 2);
        b.Property(x => x.CreatedAtUtc).IsRequired();
    }
}

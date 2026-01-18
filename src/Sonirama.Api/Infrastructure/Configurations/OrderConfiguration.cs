using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Infrastructure.Configurations;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Number).IsUnique();
        b.Property(x => x.Number).IsRequired().HasMaxLength(32);
        b.Property(x => x.Status).HasDefaultValue(OrderStatus.PendingApproval);
        b.Property(x => x.Subtotal).HasPrecision(18, 2);
        b.Property(x => x.DiscountTotal).HasPrecision(18, 2);
        b.Property(x => x.UserDiscountPercent).HasPrecision(5, 2).HasDefaultValue(0m);
        b.Property(x => x.Total).HasPrecision(18, 2);
        b.Property(x => x.Currency).IsRequired().HasMaxLength(3);
        b.Property(x => x.UserNotes).HasMaxLength(2000);
        b.Property(x => x.AdminNotes).HasMaxLength(2000);
        b.Property(x => x.RejectionReason).HasMaxLength(1000);
        b.Property(x => x.CancellationReason).HasMaxLength(1000);
        b.Property(x => x.CreatedAtUtc).IsRequired();
        b.Property(x => x.UpdatedAtUtc).IsRequired();

        b.HasMany(x => x.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

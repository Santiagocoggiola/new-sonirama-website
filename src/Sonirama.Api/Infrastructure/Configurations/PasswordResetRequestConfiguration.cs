using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Configurations;

// EF Core configuration for PasswordResetRequest entity.
public class PasswordResetRequestConfiguration : IEntityTypeConfiguration<PasswordResetRequest>
{
    public void Configure(EntityTypeBuilder<PasswordResetRequest> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).IsRequired().HasMaxLength(6);
        b.Property(x => x.ExpiresAtUtc).IsRequired();
        b.Property(x => x.CreatedAtUtc).IsRequired();
        b.Property(x => x.Used).HasDefaultValue(false);

        b.HasIndex(x => new { x.UserId, x.Code, x.Used });

        b.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

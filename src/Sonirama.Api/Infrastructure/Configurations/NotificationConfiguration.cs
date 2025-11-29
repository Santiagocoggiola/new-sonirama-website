using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);
        
        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);
        
        builder.Property(n => n.Body)
            .HasMaxLength(1000);
        
        builder.Property(n => n.Type)
            .IsRequired();
        
        builder.Property(n => n.IsRead)
            .IsRequired()
            .HasDefaultValue(false);
        
        builder.Property(n => n.CreatedAtUtc)
            .IsRequired();
        
        // Index for efficient queries by user and read status
        builder.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAtUtc })
            .HasDatabaseName("IX_Notifications_UserId_IsRead_CreatedAt");
        
        // Foreign key to User
        builder.HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

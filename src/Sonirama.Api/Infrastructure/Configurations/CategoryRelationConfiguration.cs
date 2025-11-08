using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Configurations;

// Configuration for CategoryRelation (self-referencing many-to-many join).
public sealed class CategoryRelationConfiguration : IEntityTypeConfiguration<CategoryRelation>
{
    public void Configure(EntityTypeBuilder<CategoryRelation> b)
    {
        b.HasKey(x => new { x.ParentId, x.ChildId });
        b.HasOne(x => x.Parent)
            .WithMany(c => c.ChildrenLink)
            .HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Child)
            .WithMany(c => c.ParentsLink)
            .HasForeignKey(x => x.ChildId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => x.ChildId);
    }
}

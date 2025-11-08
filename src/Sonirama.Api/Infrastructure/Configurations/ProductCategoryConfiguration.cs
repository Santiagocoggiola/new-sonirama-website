using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Configurations;

// Configuration for ProductCategory link (product to categories many-to-many).
public sealed class ProductCategoryConfiguration : IEntityTypeConfiguration<ProductCategory>
{
    public void Configure(EntityTypeBuilder<ProductCategory> b)
    {
        b.HasKey(x => new { x.ProductId, x.CategoryId });
        b.HasOne(x => x.Product)
            .WithMany(p => p.ProductsLink)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Category)
            .WithMany(c => c.ProductsLink)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => x.CategoryId);
    }
}

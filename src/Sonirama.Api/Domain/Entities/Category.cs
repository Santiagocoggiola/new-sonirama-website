namespace Sonirama.Api.Domain.Entities;

// Domain entity representing a product category with recursive parent/child relations.
public sealed class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<CategoryRelation> ParentsLink { get; set; } = new List<CategoryRelation>();
    public ICollection<CategoryRelation> ChildrenLink { get; set; } = new List<CategoryRelation>();
    public ICollection<ProductCategory> ProductsLink { get; set; } = new List<ProductCategory>();
}

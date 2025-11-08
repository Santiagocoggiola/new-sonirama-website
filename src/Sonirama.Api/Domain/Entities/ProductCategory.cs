namespace Sonirama.Api.Domain.Entities;

// Join entity linking products to categories (many-to-many).
public sealed class ProductCategory
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = default!;
}

namespace Sonirama.Api.Domain.Entities;

// Domain entity representing a product in the marketplace catalog.
public sealed class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = default!; // unique store code
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "ARS"; // default currency
    public int StockQuantity { get; set; }
    public string? Category { get; set; }
    public int? MinBulkQuantity { get; set; } // auto-updated from BulkDiscounts trigger
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<BulkDiscount> BulkDiscounts { get; set; } = new List<BulkDiscount>();
}

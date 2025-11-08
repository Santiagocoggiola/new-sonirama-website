namespace Sonirama.Api.Domain.Entities;

// Domain entity representing a bulk discount tier for a product.
public sealed class BulkDiscount
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;

    public int MinQuantity { get; set; } // threshold to apply discount
    public decimal DiscountPercent { get; set; } // e.g. 5.00 means 5% off
    public DateTime? StartsAtUtc { get; set; }
    public DateTime? EndsAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    public bool IsCurrentlyValid(DateTime utcNow)
        => IsActive && (StartsAtUtc is null || StartsAtUtc <= utcNow) && (EndsAtUtc is null || EndsAtUtc >= utcNow);
}

namespace Sonirama.Api.Application.Products.Discounts.Dtos;

public sealed class BulkDiscountCreateRequest
{
    public int MinQuantity { get; set; }
    public decimal DiscountPercent { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
}

namespace Sonirama.Api.Application.Products.Discounts.Dtos;

public sealed class BulkDiscountDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public int MinQuantity { get; init; }
    public decimal DiscountPercent { get; init; }
    public DateTime? StartsAtUtc { get; init; }
    public DateTime? EndsAtUtc { get; init; }
    public bool IsActive { get; init; }
}

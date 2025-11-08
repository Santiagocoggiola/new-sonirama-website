namespace Sonirama.Api.Application.Products.Dtos;

// DTO for reading product data.
public sealed class ProductDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = default!;
    public string Name { get; init; } = default!;
    public string? Description { get; init; }
    public decimal Price { get; init; }
    public string Currency { get; init; } = default!;
    public int StockQuantity { get; init; }
    public string? Category { get; init; }
    public int? MinBulkQuantity { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? UpdatedAtUtc { get; init; }
}

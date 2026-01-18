using System.Collections.Generic;

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
    public string? Category { get; set; }
    public IReadOnlyList<ProductCategoryDto> Categories { get; set; } = Array.Empty<ProductCategoryDto>();
    public int? MinBulkQuantity { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? UpdatedAtUtc { get; init; }
    public IReadOnlyList<ProductImageDto> Images { get; init; } = Array.Empty<ProductImageDto>();
}

public sealed class ProductCategoryDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = default!;
}

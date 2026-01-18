using Microsoft.AspNetCore.Http;

namespace Sonirama.Api.Application.Products.Dtos;

// Request DTO for updating an existing product (Code is immutable).
public sealed class ProductUpdateRequest
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "ARS";
    public string? Category { get; set; }
    public List<Guid>? CategoryIds { get; set; }
    public bool IsActive { get; set; } = true;
    public IFormFileCollection? Images { get; set; }
}

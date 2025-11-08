namespace Sonirama.Api.Application.Products.Dtos;

// Request DTO for creating a new product.
public sealed class ProductCreateRequest
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "ARS";
    public int StockQuantity { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
}

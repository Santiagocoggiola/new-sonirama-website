namespace Sonirama.Api.Application.Products.Dtos;

// Filter request for listing products with pagination and sorting.
public sealed class ProductFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Query { get; set; } // matches Code, Name, Category
    public string? Category { get; set; }
    public List<Guid>? CategoryIds { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; } = "CreatedAt"; // Code, Name, Price, CreatedAt
    public string? SortDir { get; set; } = "DESC"; // ASC or DESC
}

namespace Sonirama.Api.Application.Common.Models;

// Repository-level filter for products.
public sealed class ProductListFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Query { get; set; }
    public string? Category { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; } = "CreatedAt";
    public string? SortDir { get; set; } = "DESC";
}
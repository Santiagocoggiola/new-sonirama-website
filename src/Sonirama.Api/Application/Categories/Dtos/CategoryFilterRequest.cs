namespace Sonirama.Api.Application.Categories.Dtos;

// Filter request for Category listing.
public sealed class CategoryFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Query { get; set; } // name or slug match
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; } = "CreatedAt"; // Name, Slug, CreatedAt
    public string? SortDir { get; set; } = "DESC"; // ASC/DESC
}

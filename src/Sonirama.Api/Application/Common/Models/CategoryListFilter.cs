namespace Sonirama.Api.Application.Common.Models;

// Filter for repository-level category listing.
public sealed class CategoryListFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Query { get; set; }
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; } = "CreatedAt"; // Name, Slug, CreatedAt
    public string? SortDir { get; set; } = "DESC";
}

namespace Sonirama.Api.Application.Common.Models;

// Filter model for repository-level user listing.
public sealed class UserListFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Query { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; } = "CreatedAt";
    public string? SortDir { get; set; } = "DESC";
}

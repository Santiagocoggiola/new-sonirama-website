namespace Sonirama.Api.Application.Users.Dtos;

// Filter request for listing users with pagination and sorting.
public sealed class UserFilterRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Query { get; set; } // name or email contains
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
    public string? SortBy { get; set; } = "CreatedAt"; // Email, FirstName, LastName, CreatedAt
    public string? SortDir { get; set; } = "DESC"; // ASC or DESC
}

using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Application.Common.Models;

public sealed class OrderListFilter
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Query { get; set; }
    public OrderStatus? Status { get; set; }
    public DateTime? CreatedFromUtc { get; set; }
    public DateTime? CreatedToUtc { get; set; }
    public string? SortBy { get; set; } = "CreatedAt";
    public string? SortDir { get; set; } = "DESC";
    public Guid? UserId { get; set; }
    public bool IncludeAllUsers { get; set; }
}

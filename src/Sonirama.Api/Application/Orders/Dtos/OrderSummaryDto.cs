using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Application.Orders.Dtos;

public sealed class OrderSummaryDto
{
    public Guid Id { get; set; }
    public string Number { get; set; } = default!;
    public OrderStatus Status { get; set; }
    public Guid UserId { get; set; }
    public decimal Total { get; set; }
    public string Currency { get; set; } = "ARS";
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public int ItemCount { get; set; }
}

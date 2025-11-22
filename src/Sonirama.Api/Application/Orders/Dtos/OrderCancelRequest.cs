namespace Sonirama.Api.Application.Orders.Dtos;

public sealed class OrderCancelRequest
{
    public string Reason { get; set; } = string.Empty;
}

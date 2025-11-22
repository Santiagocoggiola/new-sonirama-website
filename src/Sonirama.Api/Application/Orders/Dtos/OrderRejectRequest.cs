namespace Sonirama.Api.Application.Orders.Dtos;

public sealed class OrderRejectRequest
{
    public string Reason { get; set; } = string.Empty;
}

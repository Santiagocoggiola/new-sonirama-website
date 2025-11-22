namespace Sonirama.Api.Application.Carts.Dtos;

public sealed class CartRemoveItemRequest
{
    public Guid ProductId { get; set; }
    public int? Quantity { get; set; }
}

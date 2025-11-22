namespace Sonirama.Api.Application.Carts.Dtos;

public sealed class CartAddItemRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
}

using Sonirama.Api.Application.Carts.Dtos;
using Sonirama.Api.Application.Orders.Dtos;

namespace Sonirama.Api.Application.Carts;

public interface ICartService
{
    Task<CartDto> GetCartAsync(Guid userId, CancellationToken ct);
    Task<CartDto> AddItemAsync(Guid userId, CartAddItemRequest request, CancellationToken ct);
    Task<CartDto> RemoveItemAsync(Guid userId, CartRemoveItemRequest request, CancellationToken ct);
    Task<OrderDto> CheckoutAsync(Guid userId, CancellationToken ct);
}

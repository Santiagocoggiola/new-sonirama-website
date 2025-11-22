using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

public interface ICartRepository
{
    Task<Cart?> GetByUserIdAsync(Guid userId, CancellationToken ct);
    Task<Cart?> GetDetailedByUserIdAsync(Guid userId, CancellationToken ct);
    Task<Cart> CreateAsync(Guid userId, CancellationToken ct);
    Task<CartItem?> GetItemAsync(Guid cartId, Guid productId, CancellationToken ct);
    Task AddItemAsync(CartItem item, CancellationToken ct);
    Task UpdateItemAsync(CartItem item, CancellationToken ct);
    Task RemoveItemAsync(CartItem item, CancellationToken ct);
    Task UpdateAsync(Cart cart, CancellationToken ct);
    Task ClearAsync(Guid cartId, CancellationToken ct);
}

using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

public sealed class CartRepository(AppDbContext db) : ICartRepository
{
    public async Task<Cart?> GetByUserIdAsync(Guid userId, CancellationToken ct)
        => await db.Carts.FirstOrDefaultAsync(c => c.UserId == userId, ct);

    public async Task<Cart?> GetDetailedByUserIdAsync(Guid userId, CancellationToken ct)
        => await db.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.BulkDiscounts)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

    public async Task<Cart> CreateAsync(Guid userId, CancellationToken ct)
    {
        var userExists = await db.Users.AnyAsync(u => u.Id == userId, ct);
        if (!userExists) throw new NotFoundException("Usuario no encontrado para crear el carrito");

        var cart = new Cart { UserId = userId, CreatedAtUtc = DateTime.UtcNow, UpdatedAtUtc = DateTime.UtcNow };
        await db.Carts.AddAsync(cart, ct);
        await db.SaveChangesAsync(ct);
        return cart;
    }

    public async Task<CartItem?> GetItemAsync(Guid cartId, Guid productId, CancellationToken ct)
        => await db.CartItems.Include(i => i.Product).FirstOrDefaultAsync(i => i.CartId == cartId && i.ProductId == productId, ct);

    public async Task AddItemAsync(CartItem item, CancellationToken ct)
    {
        await db.CartItems.AddAsync(item, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateItemAsync(CartItem item, CancellationToken ct)
    {
        db.CartItems.Update(item);
        await db.SaveChangesAsync(ct);
    }

    public async Task RemoveItemAsync(CartItem item, CancellationToken ct)
    {
        db.CartItems.Remove(item);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Cart cart, CancellationToken ct)
    {
        db.Carts.Update(cart);
        await db.SaveChangesAsync(ct);
    }

    public async Task ClearAsync(Guid cartId, CancellationToken ct)
    {
        var items = db.CartItems.Where(i => i.CartId == cartId);
        db.CartItems.RemoveRange(items);
        await db.SaveChangesAsync(ct);
    }
}

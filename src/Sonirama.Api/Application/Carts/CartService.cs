using System.Linq;
using Sonirama.Api.Application.Carts.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Orders;
using Sonirama.Api.Application.Orders.Dtos;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Carts;

public sealed class CartService(ICartRepository cartRepository, IProductRepository productRepository, IOrderService orderService) : ICartService
{
    private readonly ICartRepository _cartRepository = cartRepository;
    private readonly IProductRepository _productRepository = productRepository;
    private readonly IOrderService _orderService = orderService;

    public async Task<CartDto> GetCartAsync(Guid userId, CancellationToken ct)
    {
        var cart = await EnsureDetailedCartAsync(userId, ct);
        return MapCart(cart);
    }

    public async Task<CartDto> AddItemAsync(Guid userId, CartAddItemRequest request, CancellationToken ct)
    {
        if (request.Quantity <= 0) throw new ValidationException("La cantidad debe ser mayor a cero");

        var product = await _productRepository.GetByIdAsync(request.ProductId, ct) ?? throw new NotFoundException("Producto no encontrado");
        if (!product.IsActive) throw new ValidationException("El producto está inactivo");

        var cart = await EnsureCartAsync(userId, ct);
        var existingItem = await _cartRepository.GetItemAsync(cart.Id, request.ProductId, ct);

        if (existingItem is null)
        {
            var newItem = new CartItem
            {
                CartId = cart.Id,
                ProductId = request.ProductId,
                Quantity = request.Quantity,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };
            await _cartRepository.AddItemAsync(newItem, ct);
        }
        else
        {
            existingItem.Quantity += request.Quantity;
            existingItem.UpdatedAtUtc = DateTime.UtcNow;
            await _cartRepository.UpdateItemAsync(existingItem, ct);
        }

        cart.UpdatedAtUtc = DateTime.UtcNow;
        await _cartRepository.UpdateAsync(cart, ct);

        var detailed = await _cartRepository.GetDetailedByUserIdAsync(userId, ct) ?? throw new InvalidOperationException("El carrito no está disponible");
        return MapCart(detailed);
    }

    public async Task<CartDto> RemoveItemAsync(Guid userId, CartRemoveItemRequest request, CancellationToken ct)
    {
        var cart = await EnsureCartAsync(userId, ct);
        var item = await _cartRepository.GetItemAsync(cart.Id, request.ProductId, ct) ?? throw new NotFoundException("El producto no está en el carrito");

        if (!request.Quantity.HasValue || request.Quantity.Value >= item.Quantity)
        {
            await _cartRepository.RemoveItemAsync(item, ct);
        }
        else
        {
            item.Quantity -= request.Quantity.Value;
            item.UpdatedAtUtc = DateTime.UtcNow;
            await _cartRepository.UpdateItemAsync(item, ct);
        }

        cart.UpdatedAtUtc = DateTime.UtcNow;
        await _cartRepository.UpdateAsync(cart, ct);

        var detailed = await _cartRepository.GetDetailedByUserIdAsync(userId, ct) ?? throw new InvalidOperationException("El carrito no está disponible");
        return MapCart(detailed);
    }

    public Task<OrderDto> CheckoutAsync(Guid userId, CancellationToken ct)
        => _orderService.CreateFromCartAsync(userId, ct);

    private async Task<Cart> EnsureCartAsync(Guid userId, CancellationToken ct)
    {
        var cart = await _cartRepository.GetByUserIdAsync(userId, ct);
        return cart ?? await _cartRepository.CreateAsync(userId, ct);
    }

    private async Task<Cart> EnsureDetailedCartAsync(Guid userId, CancellationToken ct)
    {
        var cart = await _cartRepository.GetDetailedByUserIdAsync(userId, ct);
        if (cart is not null) return cart;
        await _cartRepository.CreateAsync(userId, ct);
        return await _cartRepository.GetDetailedByUserIdAsync(userId, ct) ?? throw new InvalidOperationException("No se pudo crear el carrito");
    }

    private CartDto MapCart(Cart cart)
    {
        var items = cart.Items.Select(MapCartItem).ToList();
        var total = items.Sum(i => i.LineTotal);
        return new CartDto
        {
            Id = cart.Id,
            Items = items,
            Total = total,
            UpdatedAtUtc = cart.UpdatedAtUtc
        };
    }

    private CartItemDto MapCartItem(CartItem item)
    {
        var product = item.Product ?? throw new InvalidOperationException("El item no tiene información del producto");
        var unitPriceBase = product.Price;
        var now = DateTime.UtcNow;
        var discounts = product.BulkDiscounts ?? Array.Empty<BulkDiscount>();
        var discount = discounts
            .Where(d => d.MinQuantity <= item.Quantity && d.IsCurrentlyValid(now))
            .OrderByDescending(d => d.DiscountPercent)
            .FirstOrDefault();

        var discountPercent = discount?.DiscountPercent ?? 0m;
        var unitPriceWithDiscount = unitPriceBase * (1 - (discountPercent / 100m));
        var lineTotal = unitPriceWithDiscount * item.Quantity;

        return new CartItemDto
        {
            ProductId = item.ProductId,
            ProductCode = product.Code,
            ProductName = product.Name,
            Quantity = item.Quantity,
            UnitPriceBase = unitPriceBase,
            DiscountPercent = discountPercent,
            UnitPriceWithDiscount = unitPriceWithDiscount,
            LineTotal = lineTotal,
            MinBulkQuantityApplied = discount?.MinQuantity
        };
    }
}

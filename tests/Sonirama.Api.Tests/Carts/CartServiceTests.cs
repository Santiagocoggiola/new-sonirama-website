using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Sonirama.Api.Application.Carts;
using Sonirama.Api.Application.Carts.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Orders;
using Sonirama.Api.Application.Orders.Dtos;
using Sonirama.Api.Domain.Entities;
using Xunit;

namespace Sonirama.Api.Tests.Carts;

public class CartServiceTests
{
    private readonly Mock<ICartRepository> _cartRepo = new();
    private readonly Mock<IProductRepository> _productRepo = new();
    private readonly Mock<IOrderService> _orderService = new();

    private CartService CreateSut() => new(_cartRepo.Object, _productRepo.Object, _orderService.Object);

    [Fact]
    public async Task GetCartAsync_ShouldCreateCart_WhenMissing()
    {
        var userId = Guid.NewGuid();
        var cartId = Guid.NewGuid();
        _cartRepo.SetupSequence(r => r.GetDetailedByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null)
            .ReturnsAsync(new Cart { Id = cartId, UserId = userId, Items = new List<CartItem>() });
        _cartRepo.Setup(r => r.CreateAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Cart { Id = cartId, UserId = userId, Items = new List<CartItem>() });

        var sut = CreateSut();
        var cart = await sut.GetCartAsync(userId, CancellationToken.None);
        cart.Id.Should().Be(cartId);
        cart.Items.Should().BeEmpty();
    }

    [Fact]
    public async Task AddItemAsync_ShouldAddNewItem()
    {
        var userId = Guid.NewGuid();
        var cartId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var product = new Product { Id = productId, Code = "P", Name = "Prod", Price = 10m, IsActive = true };

        _productRepo.Setup(r => r.GetByIdAsync(productId, It.IsAny<CancellationToken>())).ReturnsAsync(product);
        _cartRepo.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync((Cart?)null);
        _cartRepo.Setup(r => r.CreateAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(new Cart { Id = cartId, UserId = userId });
        _cartRepo.Setup(r => r.GetItemAsync(cartId, productId, It.IsAny<CancellationToken>())).ReturnsAsync((CartItem?)null);
        _cartRepo.Setup(r => r.AddItemAsync(It.IsAny<CartItem>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _cartRepo.Setup(r => r.UpdateAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _cartRepo.Setup(r => r.GetDetailedByUserIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(new Cart
        {
            Id = cartId,
            UserId = userId,
            Items = new List<CartItem>
            {
                new()
                {
                    CartId = cartId,
                    ProductId = productId,
                    Quantity = 2,
                    Product = product,
                    UpdatedAtUtc = DateTime.UtcNow
                }
            }
        });

        var sut = CreateSut();
        var cart = await sut.AddItemAsync(userId, new CartAddItemRequest { ProductId = productId, Quantity = 2 }, CancellationToken.None);
        cart.Items.Should().ContainSingle();
        cart.Items.First().Quantity.Should().Be(2);
    }

    [Fact]
    public async Task RemoveItemAsync_ShouldRemoveEntireItem_WhenQuantityNotProvided()
    {
        var userId = Guid.NewGuid();
        var cartId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var product = new Product { Id = productId, Code = "P", Name = "Prod", Price = 10m, IsActive = true };
        var cart = new Cart { Id = cartId, UserId = userId };
        var item = new CartItem { Id = Guid.NewGuid(), CartId = cartId, ProductId = productId, Quantity = 3, Product = product };

        _cartRepo.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(cart);
        _cartRepo.Setup(r => r.GetItemAsync(cartId, productId, It.IsAny<CancellationToken>())).ReturnsAsync(item);
        _cartRepo.Setup(r => r.RemoveItemAsync(item, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _cartRepo.Setup(r => r.UpdateAsync(cart, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _cartRepo.Setup(r => r.GetDetailedByUserIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(new Cart { Id = cartId, UserId = userId, Items = new List<CartItem>() });

        var sut = CreateSut();
        var result = await sut.RemoveItemAsync(userId, new CartRemoveItemRequest { ProductId = productId }, CancellationToken.None);
        result.Items.Should().BeEmpty();
        _cartRepo.Verify(r => r.RemoveItemAsync(item, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetCartAsync_ShouldApplyBulkDiscount()
    {
        var userId = Guid.NewGuid();
        var cartId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var discount = new BulkDiscount { MinQuantity = 5, DiscountPercent = 10m, IsActive = true };
        var product = new Product
        {
            Id = productId,
            Code = "P",
            Name = "Prod",
            Price = 100m,
            IsActive = true,
            BulkDiscounts = new List<BulkDiscount> { discount }
        };
        var cart = new Cart
        {
            Id = cartId,
            UserId = userId,
            Items = new List<CartItem>
            {
                new()
                {
                    CartId = cartId,
                    ProductId = productId,
                    Quantity = 5,
                    Product = product
                }
            }
        };

        _cartRepo.SetupSequence(r => r.GetDetailedByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        var sut = CreateSut();
        var result = await sut.GetCartAsync(userId, CancellationToken.None);
        result.Items.Should().ContainSingle();
        var item = result.Items.First();
        item.DiscountPercent.Should().Be(10m);
        item.UnitPriceWithDiscount.Should().Be(90m);
        item.LineTotal.Should().Be(450m);
    }

    [Fact]
    public async Task RemoveItemAsync_ShouldThrow_WhenItemMissing()
    {
        var userId = Guid.NewGuid();
        var cartId = Guid.NewGuid();
        _cartRepo.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(new Cart { Id = cartId, UserId = userId });
        _cartRepo.Setup(r => r.GetItemAsync(cartId, It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((CartItem?)null);

        var sut = CreateSut();
        await Assert.ThrowsAsync<NotFoundException>(() => sut.RemoveItemAsync(userId, new CartRemoveItemRequest { ProductId = Guid.NewGuid(), Quantity = 1 }, CancellationToken.None));
    }

    [Fact]
    public async Task CheckoutAsync_ShouldDelegateToOrderService()
    {
        var userId = Guid.NewGuid();
        var order = new OrderDto { Id = Guid.NewGuid(), Number = "SO-1" };
        _orderService.Setup(s => s.CreateFromCartAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        var sut = CreateSut();
        var result = await sut.CheckoutAsync(userId, CancellationToken.None);

        result.Should().Be(order);
        _orderService.Verify(s => s.CreateFromCartAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
    }
}

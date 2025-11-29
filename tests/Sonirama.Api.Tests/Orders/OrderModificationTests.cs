using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Orders;
using Sonirama.Api.Application.Orders.Dtos;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;
using Xunit;

namespace Sonirama.Api.Tests.Orders;

public class OrderModificationTests
{
    private readonly Mock<ICartRepository> _carts = new();
    private readonly Mock<IOrderRepository> _orders = new();
    private readonly Mock<IOrderNotificationService> _notifications = new();

    private OrderService CreateSut() => new(_carts.Object, _orders.Object, _notifications.Object);

    [Fact]
    public async Task ModifyAsync_ShouldThrow_WhenOrderNotPending()
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Status = OrderStatus.Approved,
            Items = new List<OrderItem>
            {
                new() { ProductId = Guid.NewGuid(), Quantity = 5 }
            }
        };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        var sut = CreateSut();
        var request = new OrderModifyRequest
        {
            Reason = "Stock insuficiente",
            Items = new List<OrderItemModification>
            {
                new() { ProductId = order.Items.First().ProductId, NewQuantity = 3 }
            }
        };

        await Assert.ThrowsAsync<ValidationException>(() =>
            sut.ModifyAsync(order.Id, Guid.NewGuid(), request, CancellationToken.None));
    }

    [Fact]
    public async Task ModifyAsync_ShouldThrow_WhenNoReason()
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Status = OrderStatus.PendingApproval,
            Items = new List<OrderItem>
            {
                new() { ProductId = Guid.NewGuid(), Quantity = 5 }
            }
        };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        var sut = CreateSut();
        var request = new OrderModifyRequest
        {
            Reason = "", // Empty reason
            Items = new List<OrderItemModification>
            {
                new() { ProductId = order.Items.First().ProductId, NewQuantity = 3 }
            }
        };

        await Assert.ThrowsAsync<ValidationException>(() =>
            sut.ModifyAsync(order.Id, Guid.NewGuid(), request, CancellationToken.None));
    }

    [Fact]
    public async Task ModifyAsync_ShouldUpdateQuantitiesAndStatus()
    {
        var productId = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Status = OrderStatus.PendingApproval,
            Total = 500m,
            Subtotal = 500m,
            Items = new List<OrderItem>
            {
                new()
                {
                    ProductId = productId,
                    ProductCode = "P001",
                    ProductName = "Test Product",
                    Quantity = 5,
                    UnitPrice = 100m,
                    UnitPriceWithDiscount = 100m,
                    LineTotal = 500m
                }
            }
        };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);
        _orders.Setup(r => r.UpdateAsync(order, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _notifications.Setup(n => n.NotifyUpdatedAsync(It.IsAny<OrderDto>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var request = new OrderModifyRequest
        {
            Reason = "Stock insuficiente",
            AdminNotes = "Solo tenemos 3 unidades",
            Items = new List<OrderItemModification>
            {
                new() { ProductId = productId, NewQuantity = 3 }
            }
        };

        var result = await sut.ModifyAsync(order.Id, Guid.NewGuid(), request, CancellationToken.None);

        result.Status.Should().Be(OrderStatus.ModificationPending);
        result.ModificationReason.Should().Be("Stock insuficiente");
        result.OriginalTotal.Should().Be(500m);
        result.Total.Should().Be(300m); // 3 * 100
        result.Items.First().OriginalQuantity.Should().Be(5);
        result.Items.First().Quantity.Should().Be(3);
    }

    [Fact]
    public async Task ModifyAsync_ShouldRemoveItemsWithZeroQuantity()
    {
        var product1Id = Guid.NewGuid();
        var product2Id = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Status = OrderStatus.PendingApproval,
            Total = 800m,
            Subtotal = 800m,
            Items = new List<OrderItem>
            {
                new() { ProductId = product1Id, ProductCode = "P001", ProductName = "Product 1", Quantity = 5, UnitPrice = 100m, UnitPriceWithDiscount = 100m, LineTotal = 500m },
                new() { ProductId = product2Id, ProductCode = "P002", ProductName = "Product 2", Quantity = 3, UnitPrice = 100m, UnitPriceWithDiscount = 100m, LineTotal = 300m }
            }
        };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);
        _orders.Setup(r => r.UpdateAsync(order, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _notifications.Setup(n => n.NotifyUpdatedAsync(It.IsAny<OrderDto>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var request = new OrderModifyRequest
        {
            Reason = "Producto 1 agotado",
            Items = new List<OrderItemModification>
            {
                new() { ProductId = product1Id, NewQuantity = 0 } // Remove product 1
            }
        };

        var result = await sut.ModifyAsync(order.Id, Guid.NewGuid(), request, CancellationToken.None);

        result.Items.Should().HaveCount(1);
        result.Items.Should().NotContain(i => i.ProductId == product1Id);
        result.Total.Should().Be(300m);
    }

    [Fact]
    public async Task ModifyAsync_ShouldThrow_WhenAllItemsRemoved()
    {
        var productId = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Status = OrderStatus.PendingApproval,
            Items = new List<OrderItem>
            {
                new() { ProductId = productId, Quantity = 5, UnitPrice = 100m, UnitPriceWithDiscount = 100m, LineTotal = 500m }
            }
        };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        var sut = CreateSut();
        var request = new OrderModifyRequest
        {
            Reason = "Sin stock",
            Items = new List<OrderItemModification>
            {
                new() { ProductId = productId, NewQuantity = 0 }
            }
        };

        await Assert.ThrowsAsync<ValidationException>(() =>
            sut.ModifyAsync(order.Id, Guid.NewGuid(), request, CancellationToken.None));
    }

    [Fact]
    public async Task AcceptModificationsAsync_ShouldMoveToApproved()
    {
        var userId = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Status = OrderStatus.ModificationPending,
            ModificationReason = "Stock limitado",
            OriginalTotal = 500m,
            Total = 300m,
            Items = new List<OrderItem>
            {
                new() { ProductId = Guid.NewGuid(), Quantity = 3, OriginalQuantity = 5, UnitPrice = 100m, UnitPriceWithDiscount = 100m, LineTotal = 300m }
            }
        };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);
        _orders.Setup(r => r.UpdateAsync(order, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _notifications.Setup(n => n.NotifyUpdatedAsync(It.IsAny<OrderDto>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var result = await sut.AcceptModificationsAsync(order.Id, userId, new OrderAcceptModificationsRequest { Note = "De acuerdo" }, CancellationToken.None);

        result.Status.Should().Be(OrderStatus.Approved);
        order.Items.First().OriginalQuantity.Should().BeNull(); // Cleared after acceptance
        order.OriginalTotal.Should().BeNull();
    }

    [Fact]
    public async Task AcceptModificationsAsync_ShouldThrow_WhenNotOwner()
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Status = OrderStatus.ModificationPending
        };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        var sut = CreateSut();
        await Assert.ThrowsAsync<ForbiddenException>(() =>
            sut.AcceptModificationsAsync(order.Id, Guid.NewGuid(), null, CancellationToken.None));
    }

    [Fact]
    public async Task RejectModificationsAsync_ShouldCancelOrder()
    {
        var userId = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Status = OrderStatus.ModificationPending,
            Items = new List<OrderItem>()
        };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);
        _orders.Setup(r => r.UpdateAsync(order, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _notifications.Setup(n => n.NotifyUpdatedAsync(It.IsAny<OrderDto>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var result = await sut.RejectModificationsAsync(order.Id, userId, new OrderRejectModificationsRequest { Reason = "No me sirve" }, CancellationToken.None);

        result.Status.Should().Be(OrderStatus.Cancelled);
        result.CancellationReason.Should().Contain("Usuario rechazó modificaciones");
    }

    [Fact]
    public async Task RejectModificationsAsync_ShouldThrow_WhenNoReason()
    {
        var userId = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Status = OrderStatus.ModificationPending
        };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        var sut = CreateSut();
        await Assert.ThrowsAsync<ValidationException>(() =>
            sut.RejectModificationsAsync(order.Id, userId, new OrderRejectModificationsRequest { Reason = "" }, CancellationToken.None));
    }
}

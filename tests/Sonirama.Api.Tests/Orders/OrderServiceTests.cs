using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Common.Models;
using Sonirama.Api.Application.Orders;
using Sonirama.Api.Application.Orders.Dtos;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;
using Xunit;

namespace Sonirama.Api.Tests.Orders;

public class OrderServiceTests
{
    private readonly Mock<ICartRepository> _carts = new();
    private readonly Mock<IOrderRepository> _orders = new();
    private readonly Mock<IOrderNotificationService> _notifications = new();

    private OrderService CreateSut() => new(_carts.Object, _orders.Object, _notifications.Object);

    [Fact]
    public async Task CreateFromCart_ShouldThrow_WhenCartEmpty()
    {
        var userId = Guid.NewGuid();
        var cart = new Cart { Id = Guid.NewGuid(), UserId = userId };
        _carts.Setup(r => r.GetDetailedByUserIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(cart);

        var sut = CreateSut();
        await Assert.ThrowsAsync<ValidationException>(() => sut.CreateFromCartAsync(userId, CancellationToken.None));
    }

    [Fact]
    public async Task CreateFromCart_ShouldPersistOrder_WithTotals()
    {
        var userId = Guid.NewGuid();
        var product = new Product { Id = Guid.NewGuid(), Code = "P001", Name = "Prod", Price = 100m, Currency = "ARS" };
        var cart = new Cart
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Items =
            {
                new CartItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    Product = product,
                    Quantity = 2
                }
            }
        };
        _carts.Setup(r => r.GetDetailedByUserIdAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(cart);
        _orders.Setup(r => r.AddAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
               .Returns(Task.CompletedTask)
               .Callback<Order, CancellationToken>((order, _) => order.Id = Guid.NewGuid());
        _notifications.Setup(n => n.NotifyCreatedAsync(It.IsAny<OrderDto>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _carts.Setup(r => r.ClearAsync(cart.Id, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var dto = await sut.CreateFromCartAsync(userId, CancellationToken.None);

        dto.Total.Should().Be(200m);
        dto.Subtotal.Should().Be(200m);
        dto.Items.Should().HaveCount(1);
        _carts.Verify(r => r.ClearAsync(cart.Id, It.IsAny<CancellationToken>()), Times.Once);
        _notifications.Verify(n => n.NotifyCreatedAsync(It.IsAny<OrderDto>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ConfirmAsync_ShouldFail_WhenNotOwner()
    {
        var order = new Order { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Status = OrderStatus.Approved };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        var sut = CreateSut();
        await Assert.ThrowsAsync<ForbiddenException>(() => sut.ConfirmAsync(order.Id, Guid.NewGuid(), new OrderConfirmRequest(), CancellationToken.None));
    }

    [Fact]
    public async Task ApproveAsync_ShouldUpdateStatus()
    {
        var order = new Order { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), Status = OrderStatus.PendingApproval };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);
        _orders.Setup(r => r.UpdateAsync(order, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _notifications.Setup(n => n.NotifyUpdatedAsync(It.IsAny<OrderDto>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var sut = CreateSut();
        var dto = await sut.ApproveAsync(order.Id, Guid.NewGuid(), new OrderApproveRequest { AdminNotes = "ok" }, CancellationToken.None);

        dto.Status.Should().Be(OrderStatus.Approved);
        order.ApprovedByUserId.Should().NotBeNull();
        _notifications.Verify(n => n.NotifyUpdatedAsync(It.IsAny<OrderDto>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CancelAsync_ShouldValidateReason()
    {
        var userId = Guid.NewGuid();
        var order = new Order { Id = Guid.NewGuid(), UserId = userId, Status = OrderStatus.PendingApproval };
        _orders.Setup(r => r.GetDetailedByIdAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);

        var sut = CreateSut();
        await Assert.ThrowsAsync<ValidationException>(() => sut.CancelAsync(order.Id, userId, new OrderCancelRequest { Reason = "" }, CancellationToken.None));
    }

    [Fact]
    public async Task ListAsync_ShouldForceUserScope_WhenRequesterIsUser()
    {
        var userId = Guid.NewGuid();
        var order = new Order { Id = Guid.NewGuid(), UserId = userId, Status = OrderStatus.PendingApproval };
        var paged = new PagedResult<Order>
        {
            Page = 1,
            PageSize = 10,
            TotalCount = 1,
            Items = new List<Order> { order }
        };

        _orders.Setup(r => r.ListAsync(It.Is<OrderListFilter>(f => f.UserId == userId && !f.IncludeAllUsers), It.IsAny<CancellationToken>()))
               .ReturnsAsync(paged);

        var sut = CreateSut();
        var result = await sut.ListAsync(new OrderListRequest { UserId = Guid.NewGuid() }, userId, false, CancellationToken.None);

        result.Items.Should().HaveCount(1);
        result.Items[0].Id.Should().Be(order.Id);
    }
}

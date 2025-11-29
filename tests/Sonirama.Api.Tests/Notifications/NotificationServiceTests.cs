using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Notifications;
using Sonirama.Api.Application.Notifications.Dtos;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;
using Sonirama.Api.Infrastructure.Notifications;
using Xunit;

namespace Sonirama.Api.Tests.Notifications;

public class NotificationServiceTests
{
    private readonly Mock<INotificationRepository> _notificationRepo = new();
    private readonly Mock<IUserRepository> _userRepo = new();
    private readonly Mock<IHubContext<OrdersHub>> _hubContext = new();
    private readonly Mock<IClientProxy> _clientProxy = new();
    private readonly Mock<IHubClients> _hubClients = new();

    public NotificationServiceTests()
    {
        _hubClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_clientProxy.Object);
        _hubContext.Setup(h => h.Clients).Returns(_hubClients.Object);
        _clientProxy.Setup(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    private NotificationService CreateSut() => new(_notificationRepo.Object, _userRepo.Object, _hubContext.Object);

    [Fact]
    public async Task GetNotificationsAsync_ShouldReturnPagedNotifications()
    {
        var userId = Guid.NewGuid();
        var notifications = new List<Notification>
        {
            new() { Id = Guid.NewGuid(), UserId = userId, Type = NotificationType.OrderCreated, Title = "Pedido creado" },
            new() { Id = Guid.NewGuid(), UserId = userId, Type = NotificationType.OrderApproved, Title = "Pedido aprobado" }
        };
        var pagedResult = new PagedResult<Notification>
        {
            Page = 1,
            PageSize = 10,
            TotalCount = 2,
            Items = notifications
        };
        _notificationRepo.Setup(r => r.GetByUserIdAsync(userId, 1, 10, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pagedResult);

        var sut = CreateSut();
        var result = await sut.GetNotificationsAsync(userId, new NotificationListRequest { Page = 1, PageSize = 10 }, CancellationToken.None);

        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(2);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ShouldReturnCount()
    {
        var userId = Guid.NewGuid();
        _notificationRepo.Setup(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(5);

        var sut = CreateSut();
        var count = await sut.GetUnreadCountAsync(userId, CancellationToken.None);

        count.Should().Be(5);
    }

    [Fact]
    public async Task MarkAsReadAsync_ShouldMarkNotificationAndNotifySignalR()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            UserId = userId,
            Type = NotificationType.OrderCreated,
            Title = "Test",
            IsRead = false
        };

        _notificationRepo.Setup(r => r.GetByIdAsync(notificationId, It.IsAny<CancellationToken>())).ReturnsAsync(notification);
        _notificationRepo.Setup(r => r.MarkAsReadAsync(notificationId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _notificationRepo.Setup(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(3);

        var sut = CreateSut();
        var result = await sut.MarkAsReadAsync(notificationId, userId, CancellationToken.None);

        result.Should().NotBeNull();
        result!.IsRead.Should().BeTrue();
        _notificationRepo.Verify(r => r.MarkAsReadAsync(notificationId, It.IsAny<CancellationToken>()), Times.Once);
        _clientProxy.Verify(c => c.SendCoreAsync("UnreadCountChanged", It.IsAny<object[]>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MarkAsReadAsync_ShouldReturnNull_WhenNotificationNotFound()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        _notificationRepo.Setup(r => r.GetByIdAsync(notificationId, It.IsAny<CancellationToken>())).ReturnsAsync((Notification?)null);

        var sut = CreateSut();
        var result = await sut.MarkAsReadAsync(notificationId, userId, CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task MarkAsReadAsync_ShouldReturnNull_WhenUserDoesNotOwnNotification()
    {
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            UserId = otherUserId, // Different user
            Type = NotificationType.OrderCreated,
            Title = "Test"
        };
        _notificationRepo.Setup(r => r.GetByIdAsync(notificationId, It.IsAny<CancellationToken>())).ReturnsAsync(notification);

        var sut = CreateSut();
        var result = await sut.MarkAsReadAsync(notificationId, userId, CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task MarkAllAsReadAsync_ShouldMarkAllAndNotifySignalR()
    {
        var userId = Guid.NewGuid();
        _notificationRepo.Setup(r => r.MarkAllAsReadAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(10);

        var sut = CreateSut();
        var count = await sut.MarkAllAsReadAsync(userId, CancellationToken.None);

        count.Should().Be(10);
        _clientProxy.Verify(c => c.SendCoreAsync("UnreadCountChanged", It.IsAny<object[]>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ShouldDeleteAndUpdateUnreadCount_WhenUnread()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        var notification = new Notification
        {
            Id = notificationId,
            UserId = userId,
            Type = NotificationType.OrderCreated,
            Title = "Test",
            IsRead = false
        };

        _notificationRepo.Setup(r => r.GetByIdAsync(notificationId, It.IsAny<CancellationToken>())).ReturnsAsync(notification);
        _notificationRepo.Setup(r => r.DeleteAsync(notification, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        _notificationRepo.Setup(r => r.GetUnreadCountAsync(userId, It.IsAny<CancellationToken>())).ReturnsAsync(2);

        var sut = CreateSut();
        var result = await sut.DeleteAsync(notificationId, userId, CancellationToken.None);

        result.Should().BeTrue();
        _notificationRepo.Verify(r => r.DeleteAsync(notification, It.IsAny<CancellationToken>()), Times.Once);
        _clientProxy.Verify(c => c.SendCoreAsync("UnreadCountChanged", It.IsAny<object[]>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_ShouldReturnFalse_WhenNotificationNotFound()
    {
        var userId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();
        _notificationRepo.Setup(r => r.GetByIdAsync(notificationId, It.IsAny<CancellationToken>())).ReturnsAsync((Notification?)null);

        var sut = CreateSut();
        var result = await sut.DeleteAsync(notificationId, userId, CancellationToken.None);

        result.Should().BeFalse();
    }
}

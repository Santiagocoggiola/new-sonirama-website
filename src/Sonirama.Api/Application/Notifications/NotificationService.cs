using Microsoft.AspNetCore.SignalR;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Notifications.Dtos;
using Sonirama.Api.Domain.Entities;
using Sonirama.Api.Domain.Enums;
using Sonirama.Api.Infrastructure.Notifications;

namespace Sonirama.Api.Application.Notifications;

public sealed class NotificationService(
    INotificationRepository notificationRepository,
    IUserRepository userRepository,
    IHubContext<OrdersHub> hubContext) : INotificationService
{
    private const string UnreadCountChangedEvent = "UnreadCountChanged";
    private const string NewNotificationEvent = "NewNotification";

    public async Task<PagedResult<NotificationDto>> GetNotificationsAsync(Guid userId, NotificationListRequest request, CancellationToken ct)
    {
        var result = await notificationRepository.GetByUserIdAsync(userId, request.Page, request.PageSize, request.IsRead, ct);
        
        return new PagedResult<NotificationDto>
        {
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount,
            Items = result.Items.Select(MapToDto).ToList()
        };
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct)
        => await notificationRepository.GetUnreadCountAsync(userId, ct);

    public async Task<NotificationDto?> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken ct)
    {
        var notification = await notificationRepository.GetByIdAsync(notificationId, ct);
        if (notification is null || notification.UserId != userId)
            return null;

        await notificationRepository.MarkAsReadAsync(notificationId, ct);
        
        // Notify via SignalR
        var unreadCount = await notificationRepository.GetUnreadCountAsync(userId, ct);
        await hubContext.Clients
            .Group(OrdersHub.BuildUserGroup(userId))
            .SendAsync(UnreadCountChangedEvent, new { count = unreadCount }, ct);

        notification.IsRead = true;
        notification.ReadAtUtc = DateTime.UtcNow;
        return MapToDto(notification);
    }

    public async Task<int> MarkAllAsReadAsync(Guid userId, CancellationToken ct)
    {
        var count = await notificationRepository.MarkAllAsReadAsync(userId, ct);
        
        // Notify via SignalR
        await hubContext.Clients
            .Group(OrdersHub.BuildUserGroup(userId))
            .SendAsync(UnreadCountChangedEvent, new { count = 0 }, ct);

        return count;
    }

    public async Task<bool> DeleteAsync(Guid notificationId, Guid userId, CancellationToken ct)
    {
        var notification = await notificationRepository.GetByIdAsync(notificationId, ct);
        if (notification is null || notification.UserId != userId)
            return false;

        await notificationRepository.DeleteAsync(notification, ct);
        
        // Update unread count if it was unread
        if (!notification.IsRead)
        {
            var unreadCount = await notificationRepository.GetUnreadCountAsync(userId, ct);
            await hubContext.Clients
                .Group(OrdersHub.BuildUserGroup(userId))
                .SendAsync(UnreadCountChangedEvent, new { count = unreadCount }, ct);
        }

        return true;
    }

    public async Task<NotificationDto> CreateAsync(Guid userId, NotificationType type, string title, string? body, Guid? referenceId, CancellationToken ct)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            ReferenceId = referenceId,
            CreatedAtUtc = DateTime.UtcNow
        };

        await notificationRepository.AddAsync(notification, ct);

        var dto = MapToDto(notification);

        // Send real-time notification via SignalR
        await hubContext.Clients
            .Group(OrdersHub.BuildUserGroup(userId))
            .SendAsync(NewNotificationEvent, dto, ct);

        // Also send updated unread count
        var unreadCount = await notificationRepository.GetUnreadCountAsync(userId, ct);
        await hubContext.Clients
            .Group(OrdersHub.BuildUserGroup(userId))
            .SendAsync(UnreadCountChangedEvent, new { count = unreadCount }, ct);

        return dto;
    }

    public async Task CreateForAdminsAsync(NotificationType type, string title, string? body, Guid? referenceId, CancellationToken ct)
    {
        // Get all admin users
        var admins = await userRepository.GetAdminUsersAsync(ct);
        
        if (!admins.Any())
            return;

        var notifications = admins.Select(admin => new Notification
        {
            UserId = admin.Id,
            Type = type,
            Title = title,
            Body = body,
            ReferenceId = referenceId,
            CreatedAtUtc = DateTime.UtcNow
        }).ToList();

        await notificationRepository.AddRangeAsync(notifications, ct);

        // Send per-admin notification + unread count to keep badge accurate
        foreach (var notification in notifications)
        {
            var dto = MapToDto(notification);

            await hubContext.Clients
                .Group(OrdersHub.BuildUserGroup(notification.UserId))
                .SendAsync(NewNotificationEvent, dto, ct);

            var unread = await notificationRepository.GetUnreadCountAsync(notification.UserId, ct);
            await hubContext.Clients
                .Group(OrdersHub.BuildUserGroup(notification.UserId))
                .SendAsync(UnreadCountChangedEvent, new { count = unread }, ct);
        }

        // Also broadcast to the shared admin group so online admins see it immediately
        await hubContext.Clients
            .Group(OrdersHub.AdminGroup)
            .SendAsync(NewNotificationEvent, new NotificationDto
            {
                Id = Guid.Empty,
                Type = type,
                Title = title,
                Body = body,
                ReferenceId = referenceId,
                IsRead = false,
                CreatedAtUtc = DateTime.UtcNow
            }, ct);
    }

    private static NotificationDto MapToDto(Notification n) => new()
    {
        Id = n.Id,
        Type = n.Type,
        Title = n.Title,
        Body = n.Body,
        ReferenceId = n.ReferenceId,
        IsRead = n.IsRead,
        CreatedAtUtc = n.CreatedAtUtc,
        ReadAtUtc = n.ReadAtUtc
    };
}

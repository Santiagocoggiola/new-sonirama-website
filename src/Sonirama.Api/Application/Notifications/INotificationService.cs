using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Notifications.Dtos;
using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Application.Notifications;

/// <summary>
/// Service interface for managing user notifications.
/// </summary>
public interface INotificationService
{
    /// <summary>Get paginated notifications for a user</summary>
    Task<PagedResult<NotificationDto>> GetNotificationsAsync(Guid userId, NotificationListRequest request, CancellationToken ct);
    
    /// <summary>Get unread notification count for a user</summary>
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct);
    
    /// <summary>Mark a notification as read</summary>
    Task<NotificationDto?> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken ct);
    
    /// <summary>Mark all notifications as read for a user</summary>
    Task<int> MarkAllAsReadAsync(Guid userId, CancellationToken ct);
    
    /// <summary>Delete a notification</summary>
    Task<bool> DeleteAsync(Guid notificationId, Guid userId, CancellationToken ct);
    
    /// <summary>Create and send a notification to a user</summary>
    Task<NotificationDto> CreateAsync(Guid userId, NotificationType type, string title, string? body, Guid? referenceId, CancellationToken ct);
    
    /// <summary>Create notifications for multiple users (e.g., all admins)</summary>
    Task CreateForAdminsAsync(NotificationType type, string title, string? body, Guid? referenceId, CancellationToken ct);
}

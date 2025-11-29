using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

/// <summary>
/// Repository interface for notification persistence.
/// </summary>
public interface INotificationRepository
{
    /// <summary>Get notification by ID</summary>
    Task<Notification?> GetByIdAsync(Guid id, CancellationToken ct);
    
    /// <summary>Get paginated notifications for a user</summary>
    Task<PagedResult<Notification>> GetByUserIdAsync(Guid userId, int page, int pageSize, bool? isRead, CancellationToken ct);
    
    /// <summary>Get unread count for a user</summary>
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct);
    
    /// <summary>Add a new notification</summary>
    Task<Notification> AddAsync(Notification notification, CancellationToken ct);
    
    /// <summary>Add multiple notifications (batch)</summary>
    Task AddRangeAsync(IEnumerable<Notification> notifications, CancellationToken ct);
    
    /// <summary>Mark a notification as read</summary>
    Task MarkAsReadAsync(Guid id, CancellationToken ct);
    
    /// <summary>Mark all notifications as read for a user</summary>
    Task<int> MarkAllAsReadAsync(Guid userId, CancellationToken ct);
    
    /// <summary>Delete a notification</summary>
    Task DeleteAsync(Notification notification, CancellationToken ct);
    
    /// <summary>Delete old read notifications (cleanup)</summary>
    Task<int> DeleteOldReadNotificationsAsync(Guid userId, int keepCount, CancellationToken ct);
}

using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Domain.Entities;

/// <summary>
/// Notification entity for persistent user notifications (bell icon with unread count).
/// </summary>
public sealed class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    /// <summary>User who receives this notification</summary>
    public Guid UserId { get; set; }
    public User? User { get; set; }
    
    /// <summary>Type of notification</summary>
    public NotificationType Type { get; set; }
    
    /// <summary>Short title for the notification</summary>
    public string Title { get; set; } = default!;
    
    /// <summary>Optional detailed message</summary>
    public string? Body { get; set; }
    
    /// <summary>Optional reference to related entity (OrderId, ProductId, etc.)</summary>
    public Guid? ReferenceId { get; set; }
    
    /// <summary>Whether the notification has been read</summary>
    public bool IsRead { get; set; } = false;
    
    /// <summary>When the notification was created</summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    
    /// <summary>When the notification was read (null if unread)</summary>
    public DateTime? ReadAtUtc { get; set; }
}

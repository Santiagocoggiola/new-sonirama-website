using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Application.Notifications.Dtos;

public sealed class NotificationDto
{
    public Guid Id { get; set; }
    public NotificationType Type { get; set; }
    public string TypeName => Type.ToString();
    public string Title { get; set; } = default!;
    public string? Body { get; set; }
    public Guid? ReferenceId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ReadAtUtc { get; set; }
}

public sealed class NotificationListRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool? IsRead { get; set; }
}

public sealed class UnreadCountDto
{
    public int Count { get; set; }
}

public sealed class CreateNotificationRequest
{
    public Guid UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = default!;
    public string? Body { get; set; }
    public Guid? ReferenceId { get; set; }
}

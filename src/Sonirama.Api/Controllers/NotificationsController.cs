using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Notifications;
using Sonirama.Api.Application.Notifications.Dtos;
using Sonirama.Api.Infrastructure.Extensions;

namespace Sonirama.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController(INotificationService notificationService) : ControllerBase
{
    /// <summary>
    /// Get paginated list of notifications for the current user.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<NotificationDto>>> GetNotifications(
        [FromQuery] NotificationListRequest request, 
        CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var result = await notificationService.GetNotificationsAsync(userId.Value, request, ct);
        return Ok(result);
    }

    /// <summary>
    /// Get unread notification count for the current user.
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<UnreadCountDto>> GetUnreadCount(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var count = await notificationService.GetUnreadCountAsync(userId.Value, ct);
        return Ok(new UnreadCountDto { Count = count });
    }

    /// <summary>
    /// Mark a specific notification as read.
    /// </summary>
    [HttpPost("{id:guid}/read")]
    public async Task<ActionResult<NotificationDto>> MarkAsRead(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var result = await notificationService.MarkAsReadAsync(id, userId.Value, ct);
        if (result is null) return NotFound();

        return Ok(result);
    }

    /// <summary>
    /// Mark all notifications as read for the current user.
    /// </summary>
    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllAsRead(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var count = await notificationService.MarkAllAsReadAsync(userId.Value, ct);
        return Ok(new { markedAsRead = count });
    }

    /// <summary>
    /// Delete a notification.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var deleted = await notificationService.DeleteAsync(id, userId.Value, ct);
        if (!deleted) return NotFound();

        return NoContent();
    }
}

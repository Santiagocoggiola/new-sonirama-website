using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Dtos;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

public sealed class NotificationRepository(AppDbContext db) : INotificationRepository
{
    public async Task<Notification?> GetByIdAsync(Guid id, CancellationToken ct)
        => await db.Notifications.FirstOrDefaultAsync(n => n.Id == id, ct);

    public async Task<PagedResult<Notification>> GetByUserIdAsync(Guid userId, int page, int pageSize, bool? isRead, CancellationToken ct)
    {
        var query = db.Notifications
            .Where(n => n.UserId == userId)
            .AsQueryable();

        if (isRead.HasValue)
        {
            query = query.Where(n => n.IsRead == isRead.Value);
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<Notification>
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            Items = items
        };
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct)
        => await db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);

    public async Task<Notification> AddAsync(Notification notification, CancellationToken ct)
    {
        db.Notifications.Add(notification);
        await db.SaveChangesAsync(ct);
        return notification;
    }

    public async Task AddRangeAsync(IEnumerable<Notification> notifications, CancellationToken ct)
    {
        db.Notifications.AddRange(notifications);
        await db.SaveChangesAsync(ct);
    }

    public async Task MarkAsReadAsync(Guid id, CancellationToken ct)
    {
        await db.Notifications
            .Where(n => n.Id == id && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAtUtc, DateTime.UtcNow), ct);
    }

    public async Task<int> MarkAllAsReadAsync(Guid userId, CancellationToken ct)
    {
        return await db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAtUtc, DateTime.UtcNow), ct);
    }

    public async Task DeleteAsync(Notification notification, CancellationToken ct)
    {
        db.Notifications.Remove(notification);
        await db.SaveChangesAsync(ct);
    }

    public async Task<int> DeleteOldReadNotificationsAsync(Guid userId, int keepCount, CancellationToken ct)
    {
        // Get IDs of notifications to keep (most recent read ones)
        var idsToKeep = await db.Notifications
            .Where(n => n.UserId == userId && n.IsRead)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(keepCount)
            .Select(n => n.Id)
            .ToListAsync(ct);

        // Delete older read notifications
        return await db.Notifications
            .Where(n => n.UserId == userId && n.IsRead && !idsToKeep.Contains(n.Id))
            .ExecuteDeleteAsync(ct);
    }
}

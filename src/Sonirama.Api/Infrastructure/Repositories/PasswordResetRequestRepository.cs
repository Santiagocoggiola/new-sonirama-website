using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

// EF Core implementation for password reset request repository.
public sealed class PasswordResetRequestRepository(AppDbContext db) : IPasswordResetRequestRepository
{
    public async Task<PasswordResetRequest?> GetActiveByUserAsync(Guid userId, CancellationToken ct)
        => await db.PasswordResetRequests
            .Where(r => r.UserId == userId && !r.Used && r.ExpiresAtUtc > DateTime.UtcNow)
            .OrderByDescending(r => r.CreatedAtUtc)
            .FirstOrDefaultAsync(ct);

    public async Task AddAsync(PasswordResetRequest request, CancellationToken ct)
    {
        await db.PasswordResetRequests.AddAsync(request, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task MarkUsedAsync(PasswordResetRequest request, CancellationToken ct)
    {
        request.Used = true;
        request.UsedAtUtc = DateTime.UtcNow;
        db.PasswordResetRequests.Update(request);
        await db.SaveChangesAsync(ct);
    }
}

using Microsoft.EntityFrameworkCore;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Infrastructure.Repositories;

public sealed class RefreshTokenRepository(AppDbContext db) : IRefreshTokenRepository
{
    public async Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken ct)
        => await db.RefreshTokens.Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == token, ct);

    public async Task AddAsync(RefreshToken refreshToken, CancellationToken ct)
    {
        await db.RefreshTokens.AddAsync(refreshToken, ct);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(RefreshToken refreshToken, CancellationToken ct)
    {
        db.RefreshTokens.Update(refreshToken);
        await db.SaveChangesAsync(ct);
    }

    public async Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var tokens = await db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null && t.ExpiresAtUtc > now)
            .ToListAsync(ct);

        foreach (var t in tokens)
        {
            t.RevokedAtUtc = now;
        }

        await db.SaveChangesAsync(ct);
        return tokens.Count;
    }
}


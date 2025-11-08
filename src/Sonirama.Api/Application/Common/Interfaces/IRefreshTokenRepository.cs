using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByTokenAsync(string token, CancellationToken ct);
    Task AddAsync(RefreshToken refreshToken, CancellationToken ct);
    Task UpdateAsync(RefreshToken refreshToken, CancellationToken ct);
    Task<int> RevokeAllForUserAsync(Guid userId, CancellationToken ct);
}


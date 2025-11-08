using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Common.Interfaces;

// Repository abstraction for password reset requests.
public interface IPasswordResetRequestRepository
{
    Task<PasswordResetRequest?> GetActiveByUserAsync(Guid userId, CancellationToken ct);
    Task AddAsync(PasswordResetRequest request, CancellationToken ct);
    Task MarkUsedAsync(PasswordResetRequest request, CancellationToken ct);
}

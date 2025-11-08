using Sonirama.Api.Application.Auth.Dtos;

namespace Sonirama.Api.Application.Auth;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(string email, string password, CancellationToken ct);
    Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct);
    Task LogoutAsync(string refreshToken, CancellationToken ct);
    Task<int> LogoutAllAsync(Guid userId, CancellationToken ct);
}

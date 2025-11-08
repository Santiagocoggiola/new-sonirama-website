using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Sonirama.Api.Application.Auth.Dtos;
using Sonirama.Api.Application.Common.Exceptions;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Auth;

public sealed class AuthService(
    IUserRepository users,
    IRefreshTokenRepository refreshTokens,
    IJwtTokenService jwt,
    IOptions<JwtOptions> jwtOptions,
    IPasswordHasher<User> passwordHasher
) : IAuthService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async Task<AuthResponse> LoginAsync(string email, string password, CancellationToken ct)
    {
        var user = await users.GetByEmailAsync(email, ct) ?? throw new UnauthorizedDomainException("Credenciales inválidas");
        if (!user.IsActive)
            throw new UnauthorizedDomainException("Usuario inactivo");

        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (result == PasswordVerificationResult.Failed)
            throw new UnauthorizedDomainException("Credenciales inválidas");

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = passwordHasher.HashPassword(user, password);
            await users.UpdateAsync(user, ct);
        }

        var (access, expires) = jwt.GenerateAccessToken(user);
        var newRefresh = await CreateAndStoreRefreshTokenAsync(user, ct);

        return new AuthResponse
        {
            AccessToken = access,
            ExpiresAtUtc = expires,
            RefreshToken = newRefresh.Token,
            Role = user.Role,
            Email = user.Email
        };
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        var stored = await refreshTokens.GetByTokenAsync(refreshToken, ct) ?? throw new UnauthorizedDomainException("Refresh token inválido");
        if (!stored.IsActive)
            throw new UnauthorizedDomainException("Refresh token expirado o revocado");

        var user = stored.User;
        if (!user.IsActive)
            throw new UnauthorizedDomainException("Usuario inactivo");

        // Rotar refresh token: revocar el actual y emitir uno nuevo
        stored.RevokedAtUtc = DateTime.UtcNow;
        await refreshTokens.UpdateAsync(stored, ct);

        var (access, expires) = jwt.GenerateAccessToken(user);
        var newRefresh = await CreateAndStoreRefreshTokenAsync(user, ct);

        return new AuthResponse
        {
            AccessToken = access,
            ExpiresAtUtc = expires,
            RefreshToken = newRefresh.Token,
            Role = user.Role,
            Email = user.Email
        };
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct)
    {
        var stored = await refreshTokens.GetByTokenAsync(refreshToken, ct) ?? throw new UnauthorizedDomainException("Refresh token inválido");
        if (!stored.IsActive)
            throw new UnauthorizedDomainException("Refresh token expirado o revocado");

        stored.RevokedAtUtc = DateTime.UtcNow;
        await refreshTokens.UpdateAsync(stored, ct);
    }

    public async Task<int> LogoutAllAsync(Guid userId, CancellationToken ct)
        => await refreshTokens.RevokeAllForUserAsync(userId, ct);

    private async Task<RefreshToken> CreateAndStoreRefreshTokenAsync(User user, CancellationToken ct)
    {
        // Asegurar unicidad intentando algunas veces (índice único)
        string token;
        int attempts = 0;
        do
        {
            token = jwt.GenerateRefreshToken();
            var existing = await refreshTokens.GetByTokenAsync(token, ct);
            if (existing == null) break;
        } while (++attempts < 3);

        var refresh = new RefreshToken
        {
            Token = token,
            UserId = user.Id,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(_jwtOptions.RefreshTokenDays)
        };

        await refreshTokens.AddAsync(refresh, ct);
        return refresh;
    }
}

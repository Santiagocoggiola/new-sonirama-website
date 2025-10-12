using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Application.Auth;

public interface IJwtTokenService
{
    (string accessToken, DateTime expiresAtUtc) GenerateAccessToken(User user);
    string GenerateRefreshToken();
}

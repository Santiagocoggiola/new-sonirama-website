namespace Sonirama.Api.Application.Auth.Dtos;

// Request model for logout endpoint (revoke specific refresh token)
public sealed class LogoutRequest
{
    public string RefreshToken { get; set; } = default!;
}

namespace Sonirama.Api.Application.Auth.Dtos;

public sealed class AuthResponse
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public DateTime ExpiresAtUtc { get; init; }
    public string Role { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}


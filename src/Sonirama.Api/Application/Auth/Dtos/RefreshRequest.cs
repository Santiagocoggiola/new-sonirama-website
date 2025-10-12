namespace Sonirama.Api.Application.Auth.Dtos;

public sealed class RefreshRequest
{
    public string RefreshToken { get; init; } = string.Empty;
}


namespace Sonirama.Api.Application.Users.Dtos;

// Request DTO for self-service password change.
public sealed class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = default!;
    public string NewPassword { get; set; } = default!;
}

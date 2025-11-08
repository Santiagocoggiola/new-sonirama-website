namespace Sonirama.Api.Application.Users.Dtos;

// Request DTO for updating an existing user (ADMIN only).
public sealed class UserUpdateRequest
{
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = Domain.Enums.Role.User;
    public bool IsActive { get; set; } = true;
}

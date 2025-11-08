using System;

namespace Sonirama.Api.Application.Users.Dtos;

// Request DTO for creating a new user (ADMIN only).
public sealed class UserCreateRequest
{
    public string Email { get; set; } = default!;
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = Domain.Enums.Role.User; // default role
}

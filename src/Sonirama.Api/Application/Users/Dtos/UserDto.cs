using System;

namespace Sonirama.Api.Application.Users.Dtos;

// DTO for reading user information safely.
public sealed class UserDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = default!;
    public string FirstName { get; init; } = default!;
    public string LastName { get; init; } = default!;
    public string? PhoneNumber { get; init; }
    public string Role { get; init; } = default!;
    public bool IsActive { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? UpdatedAtUtc { get; init; }
}

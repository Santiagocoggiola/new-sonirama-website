namespace Sonirama.Api.Application.Users.Dtos;

// Request DTO for updating the current user's profile information.
public sealed class UserProfileUpdateRequest
{
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? PhoneNumber { get; set; }
}

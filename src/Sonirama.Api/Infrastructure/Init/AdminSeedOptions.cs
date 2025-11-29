namespace Sonirama.Api.Infrastructure.Init;

public sealed class AdminSeedOptions
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string Role { get; init; } = "ADMIN";
    public string FirstName { get; init; } = "Admin";
    public string LastName { get; init; } = "Sonirama";
}

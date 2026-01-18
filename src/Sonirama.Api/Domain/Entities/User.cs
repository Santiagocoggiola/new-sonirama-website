using Sonirama.Api.Domain.Enums;

namespace Sonirama.Api.Domain.Entities;

// Domain entity representing a marketplace user with authentication and audit data.
public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string Role { get; set; } = Sonirama.Api.Domain.Enums.Role.User;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }

    // Profile fields
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? PhoneNumber { get; set; }
    public decimal DiscountPercent { get; set; }

    // Lockout fields
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockoutEndUtc { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    /// <summary>
    /// Checks if the user is currently locked out.
    /// </summary>
    public bool IsLockedOut => LockoutEndUtc.HasValue && LockoutEndUtc > DateTime.UtcNow;

    /// <summary>
    /// Gets remaining lockout time, or null if not locked out.
    /// </summary>
    public TimeSpan? RemainingLockoutTime => IsLockedOut ? LockoutEndUtc - DateTime.UtcNow : null;
}

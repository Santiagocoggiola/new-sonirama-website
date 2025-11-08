using Sonirama.Api.Domain.Entities;

namespace Sonirama.Api.Domain.Entities;

// Domain entity representing a single password reset request with verification code.
public sealed class PasswordResetRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Code { get; set; } = default!; // 6 digits
    public DateTime ExpiresAtUtc { get; set; }
    public bool Used { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAtUtc { get; set; }
}

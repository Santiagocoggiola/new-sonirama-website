namespace Sonirama.Api.Infrastructure.Email;

/// <summary>
/// Configuration options for SMTP email sending.
/// </summary>
public sealed class SmtpOptions
{
    public string Host { get; init; } = string.Empty;
    public int Port { get; init; } = 587;
    public string User { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FromEmail { get; init; } = string.Empty;
    public string FromName { get; init; } = "Sonirama";
    public bool UseSsl { get; init; } = true;
    
    /// <summary>
    /// If true, uses ConsoleEmailSender instead of SMTP (for development).
    /// </summary>
    public bool UseConsole { get; init; } = false;
}

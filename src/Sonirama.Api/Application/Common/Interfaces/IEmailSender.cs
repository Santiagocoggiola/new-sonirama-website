namespace Sonirama.Api.Application.Common.Interfaces;

// Abstraction for sending emails (can be swapped with real provider).
public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string body, CancellationToken ct);
}

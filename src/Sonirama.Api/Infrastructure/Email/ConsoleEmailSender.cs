using Sonirama.Api.Application.Common.Interfaces;

namespace Sonirama.Api.Infrastructure.Email;

// Simple console-based email sender for development/testing.
public sealed class ConsoleEmailSender : IEmailSender
{
    public Task SendAsync(string toEmail, string subject, string body, CancellationToken ct)
    {
        Console.WriteLine($"[EMAIL] To: {toEmail} | Subject: {subject}\n{body}");
        return Task.CompletedTask;
    }
}

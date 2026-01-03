using Sonirama.Api.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Sonirama.Api.Infrastructure.Email;

// Development email sender that logs messages to console for testing/playwright flows.
public sealed class DevEmailSender : IEmailSender
{
    private readonly ILogger<DevEmailSender> _logger;

    public DevEmailSender(ILogger<DevEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string subject, string body, CancellationToken ct)
    {
        // Structured logs + console for easy scraping
        var message = $"[DEV EMAIL] To: {toEmail} | Subject: {subject}\n{body}";
        Console.WriteLine(message);
        _logger.LogInformation(message);
        return Task.CompletedTask;
    }
}

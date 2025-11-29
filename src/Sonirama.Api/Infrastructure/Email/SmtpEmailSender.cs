using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Sonirama.Api.Application.Common.Interfaces;

namespace Sonirama.Api.Infrastructure.Email;

/// <summary>
/// SMTP-based email sender for production use.
/// </summary>
public sealed class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(_options.Host))
        {
            _logger.LogWarning("SMTP Host no configurado. Email no enviado a {Email}", toEmail);
            return;
        }

        try
        {
            using var client = new SmtpClient(_options.Host, _options.Port)
            {
                EnableSsl = _options.UseSsl,
                Credentials = new NetworkCredential(_options.User, _options.Password),
                DeliveryMethod = SmtpDeliveryMethod.Network,
                Timeout = 30000 // 30 segundos
            };

            var from = new MailAddress(_options.FromEmail, _options.FromName);
            var to = new MailAddress(toEmail);

            using var message = new MailMessage(from, to)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };

            await client.SendMailAsync(message, ct);
            _logger.LogInformation("Email enviado exitosamente a {Email} - Asunto: {Subject}", toEmail, subject);
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex, "Error SMTP enviando email a {Email}. StatusCode: {StatusCode}", toEmail, ex.StatusCode);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error inesperado enviando email a {Email}", toEmail);
            throw;
        }
    }
}

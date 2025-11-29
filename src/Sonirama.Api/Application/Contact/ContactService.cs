using Microsoft.Extensions.Options;
using Sonirama.Api.Application.Common.Interfaces;
using Sonirama.Api.Application.Contact.Dtos;

namespace Sonirama.Api.Application.Contact;

public sealed class ContactService : IContactService
{
    private readonly IEmailSender _emailSender;
    private readonly ContactOptions _options;
    private readonly ILogger<ContactService> _logger;

    public ContactService(
        IEmailSender emailSender, 
        IOptions<ContactOptions> options,
        ILogger<ContactService> logger)
    {
        _emailSender = emailSender;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<ContactResponse> SendMessageAsync(ContactRequest request, CancellationToken ct)
    {
        if (!_options.Enabled)
        {
            _logger.LogWarning("Intento de enviar mensaje de contacto pero el sistema está deshabilitado");
            return new ContactResponse
            {
                Success = false,
                Message = "El sistema de contacto no está disponible en este momento."
            };
        }

        if (string.IsNullOrWhiteSpace(_options.DestinationEmail))
        {
            _logger.LogError("No se configuró el email destino para contacto (Contact:DestinationEmail)");
            return new ContactResponse
            {
                Success = false,
                Message = "El sistema de contacto no está configurado correctamente."
            };
        }

        try
        {
            var subject = BuildSubject(request);
            var body = BuildEmailBody(request);

            await _emailSender.SendAsync(_options.DestinationEmail, subject, body, ct);

            _logger.LogInformation(
                "Mensaje de contacto enviado exitosamente desde {Email} - Asunto: {Subject}",
                request.Email,
                request.Subject ?? "(sin asunto)");

            return new ContactResponse
            {
                Success = true,
                Message = "Tu mensaje fue enviado correctamente. Te responderemos a la brevedad."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enviando mensaje de contacto desde {Email}", request.Email);
            return new ContactResponse
            {
                Success = false,
                Message = "Ocurrió un error al enviar el mensaje. Por favor, intentá de nuevo más tarde."
            };
        }
    }

    private string BuildSubject(ContactRequest request)
    {
        var userSubject = string.IsNullOrWhiteSpace(request.Subject) 
            ? "Nuevo mensaje" 
            : request.Subject.Trim();
        
        return $"{_options.SubjectPrefix} {userSubject}";
    }

    private static string BuildEmailBody(ContactRequest request)
    {
        return $"""
            ══════════════════════════════════════════════════════════
            NUEVO MENSAJE DE CONTACTO
            ══════════════════════════════════════════════════════════

            De: {request.Name}
            Email: {request.Email}
            Fecha: {DateTime.Now:dd/MM/yyyy HH:mm}

            ──────────────────────────────────────────────────────────
            MENSAJE:
            ──────────────────────────────────────────────────────────

            {request.Message}

            ══════════════════════════════════════════════════════════
            Este mensaje fue enviado desde el formulario de contacto web.
            Para responder, enviá un email a: {request.Email}
            ══════════════════════════════════════════════════════════
            """;
    }
}

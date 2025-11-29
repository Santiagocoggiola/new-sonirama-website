namespace Sonirama.Api.Application.Contact.Dtos;

/// <summary>
/// Request para enviar un mensaje de contacto.
/// </summary>
public sealed class ContactRequest
{
    /// <summary>Nombre completo del remitente</summary>
    public string Name { get; set; } = default!;
    
    /// <summary>Email de contacto del remitente</summary>
    public string Email { get; set; } = default!;
    
    /// <summary>Asunto del mensaje (opcional)</summary>
    public string? Subject { get; set; }
    
    /// <summary>Contenido del mensaje</summary>
    public string Message { get; set; } = default!;
}

/// <summary>
/// Respuesta tras enviar mensaje de contacto.
/// </summary>
public sealed class ContactResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = default!;
}

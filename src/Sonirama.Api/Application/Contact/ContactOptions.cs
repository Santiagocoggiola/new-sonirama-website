namespace Sonirama.Api.Application.Contact;

/// <summary>
/// Configuración para el sistema de contacto.
/// </summary>
public sealed class ContactOptions
{
    /// <summary>Email destino donde se reciben los mensajes de contacto</summary>
    public string DestinationEmail { get; set; } = string.Empty;
    
    /// <summary>Nombre para el destinatario (opcional)</summary>
    public string DestinationName { get; set; } = "Sonirama Contacto";
    
    /// <summary>Prefijo para el asunto de los emails</summary>
    public string SubjectPrefix { get; set; } = "[Contacto Web]";
    
    /// <summary>Habilitar/deshabilitar el endpoint de contacto</summary>
    public bool Enabled { get; set; } = true;
}

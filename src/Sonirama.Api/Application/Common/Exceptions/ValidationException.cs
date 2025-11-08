namespace Sonirama.Api.Application.Common.Exceptions;

// 400 Bad Request validation/business rule failure.
public sealed class ValidationException : DomainException
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationException(string message) : base(message, 400)
    {
        Errors = new Dictionary<string, string[]> { { "General", new[] { message } } };
    }

    public ValidationException(Dictionary<string, string[]> errors) : base("Errores de validación", 400)
    {
        Errors = errors;
    }
}

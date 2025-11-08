namespace Sonirama.Api.Application.Common.Exceptions;

// Base exception for domain/application errors with an HTTP status suggestion.
public abstract class DomainException : Exception
{
    protected DomainException(string message, int statusCode) : base(message)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }
}

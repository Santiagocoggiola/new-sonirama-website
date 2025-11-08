namespace Sonirama.Api.Application.Common.Exceptions;

// 401 Unauthorized for authentication related failures.
public sealed class UnauthorizedDomainException : DomainException
{
    public UnauthorizedDomainException(string message) : base(message, 401) { }
}

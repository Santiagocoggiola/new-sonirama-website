namespace Sonirama.Api.Application.Common.Exceptions;

// 403 Forbidden when action not allowed.
public sealed class ForbiddenException : DomainException
{
    public ForbiddenException(string message) : base(message, 403) { }
}

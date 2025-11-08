namespace Sonirama.Api.Application.Common.Exceptions;

// 409 Conflict for duplicate or state conflicts.
public sealed class ConflictException : DomainException
{
    public ConflictException(string message) : base(message, 409) { }
}

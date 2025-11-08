namespace Sonirama.Api.Application.Common.Exceptions;

// 404 Not Found exception with Spanish message.
public sealed class NotFoundException : DomainException
{
    public NotFoundException(string message) : base(message, 404) { }
}

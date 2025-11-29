using Sonirama.Api.Application.Contact.Dtos;

namespace Sonirama.Api.Application.Contact;

public interface IContactService
{
    Task<ContactResponse> SendMessageAsync(ContactRequest request, CancellationToken ct);
}

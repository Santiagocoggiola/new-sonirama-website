using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Sonirama.Api.Application.Contact;
using Sonirama.Api.Application.Contact.Dtos;

namespace Sonirama.Api.Controllers;

[ApiController]
[Route("api/contact")]
public sealed class ContactController(IContactService contactService) : ControllerBase
{
    /// <summary>
    /// Envía un mensaje de contacto. Rate limited: 3 mensajes por minuto por IP.
    /// </summary>
    [HttpPost]
    [EnableRateLimiting("contact")]
    public async Task<ActionResult<ContactResponse>> SendMessage(
        [FromBody] ContactRequest request, 
        CancellationToken ct)
    {
        var result = await contactService.SendMessageAsync(request, ct);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }
        
        return Ok(result);
    }
}

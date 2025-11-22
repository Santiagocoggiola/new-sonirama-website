using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sonirama.Api.Application.Carts;
using Sonirama.Api.Application.Carts.Dtos;
using Sonirama.Api.Infrastructure.Extensions;

namespace Sonirama.Api.Controllers;

[ApiController]
[Route("api/cart")]
[Authorize(Roles = "ADMIN,USER")]
public sealed class CartController(ICartService service) : ControllerBase
{

    [HttpGet]
    public async Task<IActionResult> GetAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var cart = await service.GetCartAsync(userId.Value, ct);
        return Ok(cart);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItemAsync([FromBody] CartAddItemRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var cart = await service.AddItemAsync(userId.Value, request, ct);
        return Ok(cart);
    }

    [HttpDelete("items/{productId:guid}")]
    public async Task<IActionResult> RemoveItemAsync(Guid productId, [FromQuery] int? quantity, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var request = new CartRemoveItemRequest { ProductId = productId, Quantity = quantity };
        var cart = await service.RemoveItemAsync(userId.Value, request, ct);
        return Ok(cart);
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CheckoutAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var order = await service.CheckoutAsync(userId.Value, ct);
        return Created($"/api/orders/{order.Id}", order);
    }
}

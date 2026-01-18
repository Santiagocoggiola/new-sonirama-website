using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sonirama.Api.Application.Products.Discounts;
using Sonirama.Api.Application.Products.Discounts.Dtos;

namespace Sonirama.Api.Controllers;

[ApiController]
[Route("api/products/{productId:guid}/discounts")]
public sealed class BulkDiscountsController(IBulkDiscountService service) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "ADMIN,USER")]
    public async Task<IActionResult> ListAsync(Guid productId, [FromQuery] BulkDiscountListRequest request, CancellationToken ct)
        => Ok(await service.ListByProductAsync(productId, request, ct));

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CreateAsync(Guid productId, [FromBody] BulkDiscountCreateRequest request, CancellationToken ct)
    {
        var created = await service.CreateAsync(productId, request, ct);
        return Ok(created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateAsync(Guid productId, Guid id, [FromBody] BulkDiscountUpdateRequest request, CancellationToken ct)
        => Ok(await service.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteAsync(Guid productId, Guid id, CancellationToken ct)
    {
        await service.DeleteAsync(id, ct);
        return NoContent();
    }
}

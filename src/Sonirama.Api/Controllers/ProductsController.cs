using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sonirama.Api.Application.Products;
using Sonirama.Api.Application.Products.Dtos;

namespace Sonirama.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ProductsController(IProductService service) : ControllerBase
{
    // GET api/products
    [HttpGet]
    [Authorize(Roles = "ADMIN,USER")]
    public async Task<IActionResult> ListAsync([FromQuery] ProductFilterRequest filter, CancellationToken ct)
        => Ok(await service.ListAsync(filter, ct));

    // GET api/products/{id}
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "ADMIN,USER")]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken ct)
        => Ok(await service.GetByIdAsync(id, ct));

    // GET api/products/code/{code}
    [HttpGet("code/{code}")]
    [Authorize(Roles = "ADMIN,USER")]
    public async Task<IActionResult> GetByCodeAsync(string code, CancellationToken ct)
        => Ok(await service.GetByCodeAsync(code, ct));

    // POST api/products
    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CreateAsync([FromBody] ProductCreateRequest request, CancellationToken ct)
    {
        var created = await service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
    }

    // PUT api/products/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] ProductUpdateRequest request, CancellationToken ct)
        => Ok(await service.UpdateAsync(id, request, ct));

    // DELETE api/products/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken ct)
    {
        await service.DeleteAsync(id, ct);
        return NoContent();
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sonirama.Api.Application.Categories;
using Sonirama.Api.Application.Categories.Dtos;

namespace Sonirama.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController(ICategoryService service) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "ADMIN,USER")]
    public async Task<IActionResult> ListAsync([FromQuery] CategoryFilterRequest filter, CancellationToken ct)
        => Ok(await service.ListAsync(filter, ct));

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "ADMIN,USER")]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken ct)
        => Ok(await service.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CreateAsync([FromBody] CategoryCreateRequest request, CancellationToken ct)
    {
        var created = await service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] CategoryUpdateRequest request, CancellationToken ct)
        => Ok(await service.UpdateAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken ct)
    {
        await service.DeleteAsync(id, ct);
        return NoContent();
    }
}

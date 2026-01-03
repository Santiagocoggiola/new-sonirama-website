using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Sonirama.Api.Application.Users;
using Sonirama.Api.Application.Users.Dtos;

namespace Sonirama.Api.Controllers;

// API controller exposing user management endpoints with role-based authorization.
[ApiController]
[Route("api/users")] // endpoint-base plural lower-case
public sealed class UsersController(IUserService service) : ControllerBase
{
    [Authorize(Roles = "ADMIN,USER")]
    [HttpGet("me")]
    public async Task<ActionResult> GetMe(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var dto = await service.GetCurrentAsync(userId.Value, ct);
        return Ok(dto);
    }

    [Authorize(Roles = "ADMIN,USER")]
    [HttpPut("me")]
    public async Task<ActionResult> UpdateMe([FromBody] UserProfileUpdateRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var dto = await service.UpdateProfileAsync(userId.Value, request, ct);
        return Ok(dto);
    }

    [Authorize(Roles = "ADMIN,USER")]
    [HttpPut("me/password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        await service.ChangePasswordAsync(userId.Value, request, ct);
        return Ok();
    }

    [AllowAnonymous]
    [HttpPost("verify/start")]
    public async Task<ActionResult> StartEmailVerification([FromQuery] string email, CancellationToken ct)
    {
        await service.StartEmailVerificationAsync(email, ct);
        return Ok();
    }

    [AllowAnonymous]
    [HttpPost("verify/confirm")]
    public async Task<ActionResult> ConfirmEmailVerification([FromQuery] string email, [FromQuery] string code, CancellationToken ct)
    {
        await service.ConfirmEmailVerificationAsync(email, code, ct);
        return Ok();
    }

    [Authorize(Roles = "ADMIN,USER")]
    [HttpGet]
    public async Task<ActionResult> List([FromQuery] UserFilterRequest filter, CancellationToken ct)
    {
        var result = await service.ListAsync(filter, ct);
        return Ok(result);
    }

    [Authorize(Roles = "ADMIN,USER")]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult> GetById(Guid id, CancellationToken ct)
    {
        var dto = await service.GetByIdAsync(id, ct);
        if (dto is null) return NotFound();
        return Ok(dto);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] UserCreateRequest request, CancellationToken ct)
    {
        var dto = await service.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult> Update(Guid id, [FromBody] UserUpdateRequest request, CancellationToken ct)
    {
        var dto = await service.UpdateAsync(id, request, ct);
        return Ok(dto);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken ct)
    {
        await service.DeleteAsync(id, ct);
        return Ok();
    }

    [AllowAnonymous]
    [HttpPost("password-reset/start")] // start anonymous flow
    [EnableRateLimiting("password-reset")]
    public async Task<ActionResult> StartReset([FromQuery] string email, CancellationToken ct)
    {
        await service.StartPasswordResetAsync(email, ct);
        return Ok();
    }

    [AllowAnonymous]
    [HttpPost("password-reset/confirm")] // confirm anonymous flow
    [EnableRateLimiting("auth")]
    public async Task<ActionResult> ConfirmReset([FromQuery] string email, [FromQuery] string code, CancellationToken ct)
    {
        await service.ConfirmPasswordResetAsync(email, code, ct);
        return Ok();
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("{id:guid}/password-reset/force")] // admin direct reset
    public async Task<ActionResult> ForceReset(Guid id, CancellationToken ct)
    {
        await service.ForcePasswordResetAsync(id, ct);
        return Ok();
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.Claims
            .FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "sub")?.Value;

        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

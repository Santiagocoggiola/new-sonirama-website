using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sonirama.Api.Application.Auth;
using Sonirama.Api.Application.Auth.Dtos;
using Sonirama.Api.Application.Common.Exceptions;

namespace Sonirama.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var resp = await authService.LoginAsync(request.Email, request.Password, ct);
        return Ok(resp);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request, CancellationToken ct)
    {
        var resp = await authService.RefreshAsync(request.RefreshToken, ct);
        return Ok(resp);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult> Logout([FromBody] RefreshRequest request, CancellationToken ct)
    {
        await authService.LogoutAsync(request.RefreshToken, ct);
        return Ok(new { mensaje = "Sesión cerrada" });
    }

    [Authorize]
    [HttpPost("logout-all")]
    public async Task<ActionResult> LogoutAll(CancellationToken ct)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier || c.Type == "sub")?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Token inválido" });

        var revoked = await authService.LogoutAllAsync(userId, ct);
        return Ok(new { mensaje = "Sesiones revocadas", cantidad = revoked });
    }
}

